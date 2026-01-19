/**
 * ARIA 无障碍辅助函数库
 * 提供常用的 ARIA 属性和无障碍模式
 */

/**
 * 生成唯一的 ID
 */
export function generateId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Dialog 的 ARIA 属性
 */
export function getDialogAriaProps(dialogId: string, titleId: string) {
  return {
    role: "dialog",
    id: dialogId,
    "aria-modal": true,
    "aria-labelledby": titleId,
  };
}

/**
 * 可聚焦元素的 ARIA 属性
 */
export function getFocusableAriaProps(element: HTMLElement) {
  const tabindex = element.getAttribute("tabindex");
  const isNaturallyFocusable =
    ["A", "BUTTON", "INPUT", "SELECT", "TEXTAREA"].includes(element.tagName) &&
    !element.hasAttribute("disabled");

  return {
    role: element.getAttribute("role"),
    tabIndex: isNaturallyFocusable ? -1 : 0,
  };
}

/**
 * 列表项的 ARIA 属性
 */
export function getListItemAriaProps(itemId: string, isSelected: boolean) {
  return {
    id: itemId,
    role: "option",
    "aria-selected": isSelected,
  };
}

/**
 * 树项的 ARIA 属性
 */
export function getTreeItemAriaProps(
  itemId: string,
  expanded: boolean,
  hasChildren: boolean,
  level: number
) {
  return {
    id: itemId,
    role: "treeitem",
    "aria-expanded": hasChildren ? expanded : undefined,
    "aria-level": level,
  };
}

/**
 * 展开/折叠按钮的 ARIA 属性
 */
export function getExpandButtonAriaProps(
  expanded: boolean,
  controls: string,
  label?: string
) {
  return {
    "aria-expanded": expanded,
    "aria-controls": controls,
    "aria-label": label,
  };
}

/**
 * 选择框的 ARIA 属性
 */
export function getCheckboxAriaProps(
  checked: boolean,
  label?: string,
  disabled?: boolean
) {
  return {
    role: "checkbox",
    "aria-checked": checked,
    "aria-label": label,
    "aria-disabled": disabled,
  };
}

/**
 * 单选框的 ARIA 属性
 */
export function getRadioAriaProps(checked: boolean, label?: string) {
  return {
    role: "radio",
    "aria-checked": checked,
    "aria-label": label,
  };
}

/**
 * 按钮的 ARIA 属性
 */
export function getButtonAriaProps(
  label?: string,
  disabled?: boolean,
  pressed?: boolean
) {
  return {
    "aria-label": label,
    "aria-disabled": disabled,
    "aria-pressed": pressed,
  };
}

/**
 * 加载状态的 ARIA 属性
 */
export function getLoadingAriaProps(loading: boolean, ariaLive: "polite" | "assertive" = "polite") {
  return {
    "aria-busy": loading,
    "aria-live": ariaLive,
  };
}

/**
 * 错误状态的 ARIA 属性
 */
export function getErrorAriaProps(errorId: string, hasError: boolean) {
  return {
    "aria-invalid": hasError,
    "aria-describedby": hasError ? errorId : undefined,
  };
}

/**
 * 表单输入的 ARIA 属性
 */
export function getInputAriaProps(
  label?: string,
  required?: boolean,
  invalid?: boolean,
  errorId?: string,
  helpId?: string
) {
  const describedBy = [];
  if (invalid && errorId) describedBy.push(errorId);
  if (helpId) describedBy.push(helpId);

  return {
    "aria-label": label,
    "aria-required": required,
    "aria-invalid": invalid,
    "aria-describedby": describedBy.length > 0 ? describedBy.join(" ") : undefined,
  };
}

/**
 * 菜单的 ARIA 属性
 */
export function getMenuAriaProps(menuId: string) {
  return {
    id: menuId,
    role: "menu",
  };
}

/**
 * 菜单项的 ARIA 属性
 */
export function getMenuItemAriaProps(disabled?: boolean, label?: string) {
  return {
    role: "menuitem",
    "aria-disabled": disabled,
    "aria-label": label,
  };
}

/**
 * 提醒的 ARIA 属性
 */
export function getAlertAriaProps(live: "polite" | "assertive" = "assertive") {
  return {
    role: "alert",
    "aria-live": live,
    "aria-atomic": true,
  };
}

/**
 * 标签页的 ARIA 属性
 */
export function getTabAriaProps(tabId: string, selected: boolean, controls: string) {
  return {
    id: tabId,
    role: "tab",
    "aria-selected": selected,
    "aria-controls": controls,
    tabIndex: selected ? 0 : -1,
  };
}

/**
 * 获取焦点陷阱的可聚焦元素
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const focusableSelectors = [
    "a[href]",
    "button:not([disabled])",
    "textarea:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "[tabindex]:not([tabindex='-1'])",
  ].join(",");

  return Array.from(container.querySelectorAll(focusableSelectors));
}

/**
 * 将焦点设置到元素
 */
export function setFocus(element: HTMLElement | null) {
  if (element && typeof element.focus === "function") {
    element.focus();
  }
}

/**
 * 陷阱焦点在容器内
 */
export function trapFocusInContainer(
  event: KeyboardEvent,
  container: HTMLElement,
  onEscape?: () => void
) {
  // 处理 Escape 键
  if (event.key === "Escape" && onEscape) {
    onEscape();
    return;
  }

  // 处理 Tab 键
  if (event.key !== "Tab") {
    return;
  }

  const focusableElements = getFocusableElements(container);
  if (focusableElements.length === 0) {
    event.preventDefault();
    return;
  }

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];
  const activeElement = document.activeElement as HTMLElement;

  if (event.shiftKey) {
    // Shift + Tab
    if (activeElement === firstElement) {
      event.preventDefault();
      setFocus(lastElement);
    }
  } else {
    // Tab
    if (activeElement === lastElement) {
      event.preventDefault();
      setFocus(firstElement);
    }
  }
}

/**
 * 宣布消息给屏幕阅读器
 */
export function announceToScreenReader(
  message: string,
  priority: "polite" | "assertive" = "polite"
) {
  const existingAnnouncer = document.getElementById("sr-announcer");
  const announcer = existingAnnouncer || document.createElement("div");

  if (!existingAnnouncer) {
    announcer.id = "sr-announcer";
    announcer.className = "sr-only";
    announcer.setAttribute("aria-live", priority);
    announcer.setAttribute("aria-atomic", "true");
    document.body.appendChild(announcer);
  } else {
    announcer.setAttribute("aria-live", priority);
  }

  announcer.textContent = message;

  // 清除消息（避免重复宣布）
  setTimeout(() => {
    announcer.textContent = "";
  }, 1000);
}
