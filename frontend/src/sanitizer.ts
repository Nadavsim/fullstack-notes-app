export const sanitizeHtml = (rawHtml: string): string => {
    if (typeof rawHtml !== 'string') return '';

    try {
        const parser = new DOMParser();
        // Parse the string into a virtual DOM Document
        const doc = parser.parseFromString(rawHtml, 'text/html');

        const cleanNode = (node: Node) => {
        // 1. Remove dangerous tags entirely
        const nodeName = node.nodeName.toLowerCase();
        if (nodeName === 'script' || nodeName === 'iframe' || nodeName === 'object') {
            node.parentNode?.removeChild(node);
            return;
        }

        // 2. Remove dangerous attributes from elements
        if (node.nodeType === Node.ELEMENT_NODE) {
            const el = node as Element;
            const attributes = el.attributes;
        
            // Loop backwards because removing an item changes the array length
            for (let i = attributes.length - 1; i >= 0; i--) {
                const attr = attributes[i];
                const attrName = attr.name.toLowerCase();
                const attrValue = attr.value.toLowerCase().trim();

                // Rule A: Drop ALL event handlers (onerror, onclick, onload, etc.)
                if (attrName.startsWith('on')) {
                    el.removeAttribute(attrName);
                }

                // Rule B: Prevent malicious URLs in href or src
                if (attrName === 'href' || attrName === 'src') {
                    if (attrValue.startsWith('javascript:') || attrValue.startsWith('data:')) {
                        el.removeAttribute(attrName);
                    }
                }
            }
        }

        // 3. Recursively clean all children
        const children = Array.from(node.childNodes);
        children.forEach(cleanNode);
        };

        // Start the cleaning process from the body of our virtual DOM
        Array.from(doc.body.childNodes).forEach(cleanNode);

        // Return the cleaned HTML string
        return doc.body.innerHTML;
    } catch (error) {
        console.error("Sanitization failed, returning empty string.", error);
        return ''; // Fail securely
    }
};