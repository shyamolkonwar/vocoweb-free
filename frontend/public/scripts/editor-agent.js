/**
 * Laxizen Editor Agent
 * Injected into website iframe to enable WYSIWYG editing.
 * Communicates with parent React app via postMessage.
 */
(function () {
    'use strict';

    // Editable element selectors
    const EDITABLE_SELECTORS = [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p',
        'a',
        'button',
        'img',
        'span.editable',
        '[data-editable]'
    ].join(', ');

    // State
    let selectedElement = null;
    let elementCounter = 0;

    // Generate unique IDs for elements without one
    function ensureElementId(el) {
        if (!el.dataset.lid) {
            el.dataset.lid = 'el-' + (++elementCounter);
        }
        return el.dataset.lid;
    }

    // Get element type for editing
    function getElementType(el) {
        const tag = el.tagName.toLowerCase();
        if (tag === 'img') return 'image';
        if (tag === 'a' || tag === 'button') return 'button';
        if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) return 'heading';
        return 'text';
    }

    // Get current content of element
    function getElementContent(el) {
        const type = getElementType(el);
        if (type === 'image') {
            return {
                src: el.src,
                alt: el.alt || ''
            };
        }
        if (type === 'button') {
            return {
                text: el.textContent.trim(),
                href: el.href || el.getAttribute('href') || ''
            };
        }
        return {
            text: el.textContent.trim()
        };
    }

    // Inject hover styles
    function injectStyles() {
        const style = document.createElement('style');
        style.id = 'laxizen-editor-styles';
        style.textContent = `
      [data-lid]:hover {
        outline: 2px dashed #0d9488 !important;
        outline-offset: 2px !important;
        cursor: pointer !important;
      }
      [data-lid].lx-selected {
        outline: 3px solid #0d9488 !important;
        outline-offset: 2px !important;
        background-color: rgba(13, 148, 136, 0.05) !important;
      }
      .lx-edit-indicator {
        position: absolute;
        background: #0d9488;
        color: white;
        font-size: 10px;
        padding: 2px 6px;
        border-radius: 3px;
        font-family: system-ui, sans-serif;
        pointer-events: none;
        z-index: 10000;
        transform: translateY(-100%);
        margin-top: -4px;
      }
      /* Protected elements - VocoWeb watermark */
      [data-vocoweb-protected],
      [data-vocoweb-protected] * {
        cursor: not-allowed !important;
        pointer-events: none !important;
      }
      [data-vocoweb-protected]:hover {
        outline: none !important;
      }
    `;
        document.head.appendChild(style);
    }

    // Tag all editable elements with data-lid
    function tagEditableElements() {
        document.querySelectorAll(EDITABLE_SELECTORS).forEach(el => {
            // Skip very small elements or script/style content
            if (el.closest('script, style, nav')) return;
            if (el.textContent.trim().length < 2 && el.tagName !== 'IMG') return;

            // Skip protected VocoWeb watermark elements
            if (el.closest('[data-vocoweb-protected]') || el.hasAttribute('data-vocoweb-protected')) return;

            ensureElementId(el);
        });
    }

    // Clear previous selection
    function clearSelection() {
        if (selectedElement) {
            selectedElement.classList.remove('lx-selected');
            selectedElement = null;
        }
        // Remove any indicators
        document.querySelectorAll('.lx-edit-indicator').forEach(el => el.remove());
    }

    // Handle element click
    function handleClick(e) {
        const target = e.target.closest('[data-lid]');

        if (!target) return;

        // Block editing of protected watermark elements
        if (target.closest('[data-vocoweb-protected]') || target.hasAttribute('data-vocoweb-protected')) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }

        // Prevent default behavior (links, buttons)
        e.preventDefault();
        e.stopPropagation();

        // Clear previous selection
        clearSelection();

        // Select new element
        selectedElement = target;
        selectedElement.classList.add('lx-selected');

        // Get element info
        const elementId = target.dataset.lid;
        const elementType = getElementType(target);
        const content = getElementContent(target);
        const rect = target.getBoundingClientRect();

        // Send message to parent
        window.parent.postMessage({
            type: 'ELEMENT_SELECTED',
            payload: {
                id: elementId,
                type: elementType,
                tag: target.tagName.toLowerCase(),
                content: content,
                rect: {
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height
                }
            }
        }, '*');
    }

    // Handle messages from parent
    function handleMessage(event) {
        const data = event.data;

        if (!data || !data.type) return;

        switch (data.type) {
            case 'UPDATE_CONTENT':
                updateElementContent(data.payload);
                break;

            case 'UPDATE_STYLE':
                updateElementStyle(data.payload);
                break;

            case 'GET_HTML':
                sendCurrentHtml();
                break;

            case 'CLEAR_SELECTION':
                clearSelection();
                break;
        }
    }

    // Update element content
    function updateElementContent(payload) {
        const { id, content } = payload;
        const el = document.querySelector(`[data-lid="${id}"]`);

        if (!el) return;

        const type = getElementType(el);

        if (type === 'image' && content.src) {
            el.src = content.src;
            if (content.alt) el.alt = content.alt;
        } else if (content.text !== undefined) {
            el.textContent = content.text;
        }

        // Notify parent of update
        window.parent.postMessage({
            type: 'CONTENT_UPDATED',
            payload: { id, success: true }
        }, '*');
    }

    // Update element style
    function updateElementStyle(payload) {
        const { id, styles } = payload;
        const el = document.querySelector(`[data-lid="${id}"]`);

        if (!el) return;

        Object.assign(el.style, styles);
    }

    // Send current HTML to parent
    function sendCurrentHtml() {
        // Clone document and clean up editor artifacts
        const clone = document.documentElement.cloneNode(true);

        // Remove editor styles
        const editorStyles = clone.querySelector('#laxizen-editor-styles');
        if (editorStyles) editorStyles.remove();

        // Remove selection classes
        clone.querySelectorAll('.lx-selected').forEach(el => {
            el.classList.remove('lx-selected');
        });

        // Remove indicators
        clone.querySelectorAll('.lx-edit-indicator').forEach(el => el.remove());

        // Get clean HTML
        const html = '<!DOCTYPE html>\n' + clone.outerHTML;

        window.parent.postMessage({
            type: 'HTML_CONTENT',
            payload: { html }
        }, '*');
    }

    // Initialize
    function init() {
        // Wait for DOM
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setup);
        } else {
            setup();
        }
    }

    function setup() {
        injectStyles();
        tagEditableElements();

        // Add click listener (capture phase for priority)
        document.addEventListener('click', handleClick, true);

        // Listen for parent messages
        window.addEventListener('message', handleMessage);

        // Notify parent we're ready
        window.parent.postMessage({ type: 'EDITOR_READY' }, '*');

        console.log('[Laxizen Editor] Agent initialized');
    }

    init();
})();
