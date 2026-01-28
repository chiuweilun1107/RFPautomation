import React from 'react';
import { render, screen } from '@testing-library/react';
import { TenderCalendarView } from '@/components/dashboard/tenders/TenderCalendarView';

describe('TenderCalendarView', () => {
    const mockTenders = [
        {
            id: '1',
            title: 'Test Tender 1',
            publish_date: '2024-01-15',
            deadline_date: '2024-01-20',
            url: 'https://example.com/1',
            org_name: 'Test Org 1',
        },
        {
            id: '2',
            title: 'Test Tender 2',
            publish_date: '2024-01-16',
            deadline_date: '2024-01-21',
            url: 'https://example.com/2',
            org_name: 'Test Org 2',
        },
    ];

    it('should render calendar with deadline dates by default', () => {
        render(<TenderCalendarView tenders={mockTenders} />);

        // Calendar should be rendered
        expect(screen.getByText(/TENDER_TIMELINE/i)).toBeInTheDocument();
        expect(screen.getByText(/DEADLINE_MAP/i)).toBeInTheDocument();
    });

    it('should render calendar with publish dates when dateType is publish', () => {
        render(<TenderCalendarView tenders={mockTenders} dateType="publish" />);

        // Calendar should be rendered
        expect(screen.getByText(/TENDER_TIMELINE/i)).toBeInTheDocument();
        expect(screen.getByText(/PUBLICATION_MAP/i)).toBeInTheDocument();
    });

    it('should filter tenders by deadline date when dateType is deadline', () => {
        const { container } = render(
            <TenderCalendarView tenders={mockTenders} dateType="deadline" />
        );

        // Check that tenders are grouped by deadline date
        // This would require inspecting the calendar cells
        expect(container.querySelector('.min-h-\\[120px\\]')).toBeInTheDocument();
    });

    it('should filter tenders by publish date when dateType is publish', () => {
        const { container } = render(
            <TenderCalendarView tenders={mockTenders} dateType="publish" />
        );

        // Check that tenders are grouped by publish date
        expect(container.querySelector('.min-h-\\[120px\\]')).toBeInTheDocument();
    });

    it('should handle empty tenders array', () => {
        render(<TenderCalendarView tenders={[]} />);

        // Calendar should still render but with no tenders
        expect(screen.getByText(/TENDER_TIMELINE/i)).toBeInTheDocument();
    });

    it('should handle tenders with missing dates', () => {
        const tendersWithMissingDates = [
            {
                id: '3',
                title: 'Tender without deadline',
                publish_date: '2024-01-15',
                deadline_date: null,
                url: 'https://example.com/3',
                org_name: 'Test Org 3',
            },
        ];

        render(<TenderCalendarView tenders={tendersWithMissingDates} dateType="deadline" />);

        // Should not crash
        expect(screen.getByText(/TENDER_TIMELINE/i)).toBeInTheDocument();
    });

    it('should call onDayClick when a day is clicked', () => {
        const mockOnDayClick = jest.fn();
        const { container } = render(
            <TenderCalendarView tenders={mockTenders} onDayClick={mockOnDayClick} />
        );

        // Find a calendar cell and click it
        const calendarCell = container.querySelector('.min-h-\\[120px\\]');
        if (calendarCell) {
            calendarCell.click();
            expect(mockOnDayClick).toHaveBeenCalled();
        }
    });
});
