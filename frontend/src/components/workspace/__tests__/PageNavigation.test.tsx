/**
 * PageNavigation Component Tests
 * Tests for PDF page navigation functionality
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PageNavigation } from '../PageNavigation';

describe('PageNavigation', () => {
    it('renders page information correctly', () => {
        const onPageChange = vi.fn();
        render(<PageNavigation currentPage={1} totalPages={10} onPageChange={onPageChange} />);

        expect(screen.getByDisplayValue('1')).toBeInTheDocument();
        expect(screen.getByText(/OF 10/i)).toBeInTheDocument();
    });

    it('calls onPageChange when next button is clicked', () => {
        const onPageChange = vi.fn();
        render(<PageNavigation currentPage={1} totalPages={10} onPageChange={onPageChange} />);

        const nextButton = screen.getAllByRole('button')[1]; // Second button is next
        fireEvent.click(nextButton);

        expect(onPageChange).toHaveBeenCalledWith(2);
    });

    it('calls onPageChange when previous button is clicked', () => {
        const onPageChange = vi.fn();
        render(<PageNavigation currentPage={5} totalPages={10} onPageChange={onPageChange} />);

        const prevButton = screen.getAllByRole('button')[0]; // First button is previous
        fireEvent.click(prevButton);

        expect(onPageChange).toHaveBeenCalledWith(4);
    });

    it('disables previous button on first page', () => {
        const onPageChange = vi.fn();
        render(<PageNavigation currentPage={1} totalPages={10} onPageChange={onPageChange} />);

        const prevButton = screen.getAllByRole('button')[0];
        expect(prevButton).toBeDisabled();
    });

    it('disables next button on last page', () => {
        const onPageChange = vi.fn();
        render(<PageNavigation currentPage={10} totalPages={10} onPageChange={onPageChange} />);

        const nextButton = screen.getAllByRole('button')[1];
        expect(nextButton).toBeDisabled();
    });

    it('updates page when input is changed and blurred', () => {
        const onPageChange = vi.fn();
        render(<PageNavigation currentPage={1} totalPages={10} onPageChange={onPageChange} />);

        const input = screen.getByDisplayValue('1');
        fireEvent.change(input, { target: { value: '5' } });
        fireEvent.blur(input);

        expect(onPageChange).toHaveBeenCalledWith(5);
    });

    it('resets input value if invalid page number is entered', () => {
        const onPageChange = vi.fn();
        render(<PageNavigation currentPage={1} totalPages={10} onPageChange={onPageChange} />);

        const input = screen.getByDisplayValue('1');
        fireEvent.change(input, { target: { value: '99' } });
        fireEvent.blur(input);

        expect(onPageChange).not.toHaveBeenCalled();
        expect(input).toHaveValue('1');
    });

    it('changes page when Enter key is pressed in input', () => {
        const onPageChange = vi.fn();
        render(<PageNavigation currentPage={1} totalPages={10} onPageChange={onPageChange} />);

        const input = screen.getByDisplayValue('1');
        fireEvent.change(input, { target: { value: '7' } });
        fireEvent.keyDown(input, { key: 'Enter' });

        expect(onPageChange).toHaveBeenCalledWith(7);
    });
});
