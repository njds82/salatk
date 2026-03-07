// ========================================
// Variable Service
// Stores and retrieves variable assignments per element.
// Each element (prayer, habit, task, time-plan) can have
// a "variable" word (1-5 chars) that links it to other elements
// carrying the same variable.
// ========================================

const VARIABLE_LINKS_KEY = "salatk_variable_links";

const VariableService = {
  // ── Helpers ─────────────────────────────────────────────────

  _load() {
    try {
      return JSON.parse(localStorage.getItem(VARIABLE_LINKS_KEY) || "[]");
    } catch {
      return [];
    }
  },

  _save(links) {
    localStorage.setItem(VARIABLE_LINKS_KEY, JSON.stringify(links));
  },

  _validate(variable) {
    if (typeof variable !== "string") return false;
    const trimmed = variable.trim();
    return trimmed.length >= 1 && trimmed.length <= 5;
  },

  // ── Public API ───────────────────────────────────────────────

  /**
   * Returns all variable link records.
   * @returns {Array<{variable, elementType, elementId, trigger}>}
   */
  getAll() {
    return this._load();
  },

  /**
   * Returns the variable link for a specific element, or null.
   * @param {string} elementType  e.g. 'prayer', 'habit', 'task', 'timeplan'
   * @param {string} elementId    e.g. 'fajr', habit UUID, task UUID, plan UUID
   */
  getForElement(elementType, elementId) {
    const links = this._load();
    return (
      links.find(
        (l) => l.elementType === elementType && l.elementId === elementId,
      ) || null
    );
  },

  /**
   * Returns all elements sharing the given variable.
   * @param {string} variable
   * @returns {Array<{variable, elementType, elementId, trigger}>}
   */
  getLinkedElements(variable) {
    if (!variable) return [];
    const links = this._load();
    return links.filter((l) => l.variable === variable.trim());
  },

  /**
   * Assigns a variable to an element, replacing any existing assignment.
   * @param {string} variable   1–5 character word
   * @param {string} elementType
   * @param {string} elementId
   * @param {string} trigger    e.g. 'done', 'missed', 'completed', 'avoided'
   * @returns {{ success: boolean, error?: string }}
   */
  set(variable, elementType, elementId, trigger) {
    const trimmed = (variable || "").trim();
    if (!this._validate(trimmed)) {
      return { success: false, error: "INVALID_VARIABLE" };
    }

    let links = this._load();
    // Remove any existing link for this element
    links = links.filter(
      (l) => !(l.elementType === elementType && l.elementId === elementId),
    );
    links.push({ variable: trimmed, elementType, elementId, trigger });
    this._save(links);
    return { success: true };
  },

  /**
   * Removes the variable assignment for an element.
   */
  remove(elementType, elementId) {
    let links = this._load();
    links = links.filter(
      (l) => !(l.elementType === elementType && l.elementId === elementId),
    );
    this._save(links);
  },
};

window.VariableService = VariableService;
