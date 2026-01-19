export function TrustBar() {
  const stats = [
    { value: "10,000+", label: "已處理文件" },
    { value: "95%", label: "時間節省" },
    { value: "500+", label: "信任企業" },
    { value: "4.9★", label: "用戶評分" },
  ];

  return (
    <section className="border-y border-gray-200 dark:border-zinc-800 bg-gray-50/80 dark:bg-zinc-900/50 py-16 md:py-20">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 md:gap-16 items-center">
          {stats.map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-3">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
