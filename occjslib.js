const config = {
    "occApiUrl": "https://corsproxy.io/?https://cde.certdigital.ro",
    "occUrl": "https://cde.certdigital.ro",
    "publicRepoPath": "/occ/public-repo-show",
    "getCertifiedEltsPath": "/occ/api/get-filtered-sheets-metadata",
    "certifiedClass": "certified-content"
}

/* begin get xpath */
const getXpathTo = (element) => {
    if (element.tagName == 'HTML')
        return '/html';
    if (element.tagName === 'BODY')
        return '/html/body';

    var ix = 0;
    var siblings = element.parentNode.childNodes;
    for (var i = 0; i < siblings.length; i++) {
        var sibling = siblings[i];
        if (sibling === element) {
            if (ix > 0) {
                return getXpathTo(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']';
            } else {
                return getXpathTo(element.parentNode) + '/' + element.tagName.toLowerCase();
            }
        }
        if (sibling.nodeType === 1 && sibling.tagName === element.tagName)
            ix++;
    }
}

const getElementbyXpath = (xpath) => {
    // Use document.evaluate() to find the element
    const result = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);

    // Check if an element was found
    if (result.singleNodeValue) {
        const element = result.singleNodeValue;
        return element;
    } else {
        return null;
    }
}
/* end get xpath */



const highlightCertifiedContent = async () => {
    const getPageUrl = () => {
         //const mockupUrl = "https://sighack.com/post/procedural-color-algorithms-color-variations";
        if (window.location.href.includes("srcdoc"))
            return document.getElementById('iframeurl').innerText;
        return window.location.href;
    }
    const getOccLibContent = async () => {
        // get window url, mockup now with right url
        // const url = this.window.location.href;
        const fetchUrl = `${config.occApiUrl}${config.getCertifiedEltsPath}?url=${encodeURIComponent(url)}`;
        const resp = await fetch(fetchUrl)
        if (!resp.ok) {
            throw new Error(`HTTP error! Status: ${resp.status}`);
        }
        const data = await resp.json();
        console.log(data)
        return data;
    }
    const addStyling = (occLibContent) => {
        console.log(occLibContent);
        for (let i = 0; i < occLibContent.length; i++) {
            const xpath = occLibContent[i].xpath;
            console.log(xpath)
            const elt = getElementbyXpath(xpath);
            console.log(elt);
            if (elt == null)
                continue;
            else elt.classList.add(config.certifiedClass);
        }
    }
    const addCustomText = (occLibContent) => {
        // group occLibContent by path
        const occLibContentGrouped = occLibContent.reduce((r, a) => {
            r[a.xpath] = [...r[a.xpath] || [], a];
            return r;
        }, {});
        // iterate through each group
        for (let path in occLibContentGrouped) {
            const occLibContentGroup = occLibContentGrouped[path];
            const certificationTypes = occLibContentGroup.map(elt => elt.label);
            const uniqueValues = [... new Set(certificationTypes)];

            let hoverText = '';

            for (let certType of uniqueValues) {
                const count = certificationTypes.filter(certificationType => certificationType == certType).length;
                const certificationMsg = `${count} persoane au spus "${certType}"`;
                hoverText += certificationMsg + '\n';
            }


            const elt = getElementbyXpath(path);
            if (elt == null)
                continue;
            elt.setAttribute('data-before', hoverText);

        }
    }
    const addInteractivity = () => {

        const elts = document.getElementsByClassName(config.certifiedClass)
        Array.from(elts).forEach(elt => {
            const originalText = elt.innerText;
            elt.addEventListener('mouseover', () => {
                elt.classList.add('hover')
            })
            elt.addEventListener('mouseout', () => {
                elt.classList.remove('hover')
                elt.innerText = originalText;
            })

            // add click event to elt
            elt.addEventListener('click', () => {
                // redirect to google search page with guid in new tab

                const xpath = getXpathTo(elt);
                const redirectUri = `${config.occUrl + config.publicRepoPath}?Url=${encodeURIComponent(url)}&Xpath=${encodeURIComponent(xpath)}`;
                console.log(redirectUri)
                window.open(redirectUri, '_blank');
            })
        })
    }


    const url = getPageUrl();
    const occLibContents = await getOccLibContent();
    addStyling(occLibContents);
    addCustomText(occLibContents);
    addInteractivity();
}

highlightCertifiedContent();