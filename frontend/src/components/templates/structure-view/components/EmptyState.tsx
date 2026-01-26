export function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-6xl mb-4">🔄</div>
            <h3 className="text-lg font-semibold mb-2">尚未解析</h3>
            <p className="text-sm text-muted-foreground max-w-md">
                此範本尚未進行結構解析。<br />
                解析功能會自動在上傳後執行,請稍後重新整理頁面。
            </p>
        </div>
    )
}
