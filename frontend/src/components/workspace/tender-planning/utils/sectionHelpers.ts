/**
 * Section Helpers
 *
 * Utility functions for section/chapter operations
 */

/**
 * Generate a new UUID for sections
 */
export function generateId(): string {
    return crypto.randomUUID();
}

/**
 * Find a section by ID in the outline
 */
export function findSectionById(outline: any[], sectionId: string): any | null {
    for (const chapter of outline) {
        if (chapter.id === sectionId) return chapter;
        if (chapter.sections) {
            const section = chapter.sections.find((s: any) => s.id === sectionId);
            if (section) return section;
        }
    }
    return null;
}
