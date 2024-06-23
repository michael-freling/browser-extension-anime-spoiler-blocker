// https://www.sitelint.com/blog/get-xpath-from-the-element-using-javascript
export function getXPathFromElement(el: Element) {
  let element: Element | (Node & ParentNode) = el;
  let parent: Element | (Node & ParentNode) | null;
  let sames: Node[];
  let elementType: number;
  let result = "";

  const filterNode = (_node: Node): void => {
    if (_node.nodeName === element.nodeName) {
      sames.push(_node);
    }
  };

  if (element instanceof Node === false) {
    return result;
  }

  parent = el.parentNode;

  while (parent !== null) {
    elementType = element.nodeType;
    sames = [];
    parent.childNodes.forEach(filterNode);

    switch (elementType) {
      case Node.ELEMENT_NODE: {
        const nodeName: string = element.nodeName.toLowerCase();
        const name: string =
          nodeName === "svg" ? `*[name()='${nodeName}']` : nodeName;
        const sameNodesCount: string = `[${
          [].indexOf.call(sames, element as never) + 1
        }]`;

        result = `/${name}${sames.length > 1 ? sameNodesCount : ""}${result}`;
        break;
      }

      case Node.TEXT_NODE: {
        result = `/text()${result}`;
        break;
      }

      case Node.ATTRIBUTE_NODE: {
        result = `/@${element.nodeName.toLowerCase()}${result}`;
        break;
      }

      case Node.COMMENT_NODE: {
        result = `/comment()${result}`;
        break;
      }

      default: {
        break;
      }
    }

    element = parent;
    parent = element.parentNode;
  }

  return `./${result}`;
}
