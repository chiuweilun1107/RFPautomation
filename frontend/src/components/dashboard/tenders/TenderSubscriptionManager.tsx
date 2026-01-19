"use client"

import * as React from "react"
import { Plus, Clock, Trash2, Loader2, Edit2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"

export function TenderSubscriptionManager() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const currentKeyword = searchParams.get('keyword')

    const [subscriptions, setSubscriptions] = React.useState<any[]>([])
    const [counts, setCounts] = React.useState<Record<string, number>>({})
    const [isLoading, setIsLoading] = React.useState(true)
    const [isDialogOpen, setIsDialogOpen] = React.useState(false)
    const [isTimePopoverOpen, setIsTimePopoverOpen] = React.useState(false)
    const [newKeyword, setNewKeyword] = React.useState("")
    const [newTime, setNewTime] = React.useState("09:00")
    const [editingId, setEditingId] = React.useState<number | null>(null)
    const supabase = createClient()

    const fetchSubscriptions = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('tender_subscriptions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (error) throw error
            const subs = data || []
            setSubscriptions(subs)

            // Fetch counts for each subscription
            const countsMap: Record<string, number> = {}
            await Promise.all(subs.map(async (sub) => {
                const { count } = await supabase
                    .from('tenders')
                    .select('*', { count: 'exact', head: true })
                    .eq('keyword_tag', sub.keyword)

                countsMap[sub.keyword] = count || 0
            }))
            setCounts(countsMap)

        } catch (error) {
            console.error('Error fetching subscriptions:', error)
        } finally {
            setIsLoading(false)
        }
    }

    React.useEffect(() => {
        fetchSubscriptions()

        // Listen for changes in tenders to update counts
        const channel = supabase
            .channel('tenders_counts')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tenders' }, () => {
                fetchSubscriptions()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const handleCardClick = (keyword: string) => {
        if (currentKeyword === keyword) {
            router.push('/dashboard/tenders')
        } else {
            router.push(`/dashboard/tenders?keyword=${encodeURIComponent(keyword)}`)
        }
    }

    const handleSaveSubscription = async () => {
        if (!newKeyword) return

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            if (editingId) {
                // Update existing
                const { error } = await supabase
                    .from('tender_subscriptions')
                    .update({
                        keyword: newKeyword,
                        schedule_time: newTime
                    })
                    .eq('id', editingId)
                    .eq('user_id', user.id)

                if (error) throw error
            } else {
                // Create new
                const { error } = await supabase.from('tender_subscriptions').insert({
                    user_id: user.id,
                    keyword: newKeyword,
                    schedule_time: newTime,
                    is_active: true
                })

                if (error) throw error
            }

            await fetchSubscriptions()
            setNewKeyword("")
            setNewTime("09:00")
            setEditingId(null)
            setIsDialogOpen(false)
        } catch (error) {
            console.error('Error saving subscription:', error)
            alert('儲存失敗，請稍後再試')
        }
    }

    const openAddDialog = () => {
        setNewKeyword("")
        setNewTime("09:00")
        setEditingId(null)
        setIsDialogOpen(true)
    }

    const openEditDialog = (sub: any, e: React.MouseEvent) => {
        e.stopPropagation()
        setNewKeyword(sub.keyword)
        setNewTime(sub.schedule_time?.substring(0, 5) || "09:00")
        setEditingId(sub.id)
        setIsDialogOpen(true)
    }

    const handleDelete = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation() // Prevent card click
        if (!confirm('確定要刪除此訂閱嗎？')) return

        try {
            const { error } = await supabase
                .from('tender_subscriptions')
                .delete()
                .eq('id', id)

            if (error) throw error
            await fetchSubscriptions()
        } catch (error) {
            console.error('Error deleting subscription:', error)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-sm font-black uppercase tracking-widest text-[#00063D] dark:text-white flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-500"></span>
                        KEYWORDS_SUBSCRIPTION
                    </h2>
                    <p className="text-[10px] font-mono font-bold text-gray-500 dark:text-gray-400">
                        DAILY_AUTO_AGGREGATION: // 設定您感興趣的標案關鍵字
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button
                            className="bg-black hover:bg-[#FA4028] text-white rounded-none border-2 border-black dark:border-white font-mono text-xs font-black uppercase tracking-wider transition-all"
                            onClick={openAddDialog}
                        >
                            <Plus className="mr-2 h-3 w-3" /> ADD_NEW
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingId ? '編輯標案訂閱' : '新增標案訂閱'}</DialogTitle>
                            <DialogDescription>
                                {editingId ? '修改關鍵字或每日接收時間。' : '輸入關鍵字與每日接收時間。'}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="keyword">關鍵字</Label>
                                <Input
                                    id="keyword"
                                    placeholder="例如：智慧醫療、AI..."
                                    value={newKeyword}
                                    onChange={(e) => setNewKeyword(e.target.value)}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="time">每日彙整時間</Label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Input
                                            id="time"
                                            type="text"
                                            placeholder="例如 09:00"
                                            value={newTime}
                                            onChange={(e) => {
                                                let val = e.target.value.replace(/[^0-9:]/g, '');
                                                if (val.length === 4 && !val.includes(':')) {
                                                    val = val.slice(0, 2) + ':' + val.slice(2);
                                                }
                                                setNewTime(val);
                                            }}
                                            className="w-full"
                                        />
                                    </div>

                                    <Popover open={isTimePopoverOpen} onOpenChange={setIsTimePopoverOpen}>
                                        <PopoverTrigger asChild>
                                            <Button variant="outline" size="icon" title="選擇時間">
                                                <Clock className="h-4 w-4" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-48 p-2 grid gap-1 max-h-[300px] overflow-y-auto">
                                            {Array.from({ length: 24 * 2 }).map((_, i) => {
                                                const h = Math.floor(i / 2).toString().padStart(2, '0');
                                                const m = (i % 2 === 0 ? '00' : '30');
                                                const timeStr = `${h}:${m}`;
                                                return (
                                                    <Button
                                                        key={timeStr}
                                                        variant="ghost"
                                                        size="sm"
                                                        className="justify-start font-normal"
                                                        onClick={() => {
                                                            setNewTime(timeStr);
                                                            setIsTimePopoverOpen(false);
                                                        }}
                                                    >
                                                        {timeStr}
                                                    </Button>
                                                )
                                            })}
                                        </PopoverContent>
                                    </Popover>

                                    <Button
                                        variant="outline"
                                        onClick={() => setNewTime("09:00")}
                                        title="重設為預設時間 (09:00)"
                                    >
                                        重設
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    可手動輸入 (HH:mm) 或點擊時鐘圖示選擇。
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>取消</Button>
                            <Button onClick={handleSaveSubscription} className="bg-[#FA4028] hover:bg-[#D32F2F]">
                                {editingId ? '儲存變更' : '確認新增'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
            ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {subscriptions.map((sub) => {
                        const isSelected = currentKeyword === sub.keyword
                        const count = counts[sub.keyword] || 0
                        return (
                            <Card
                                key={sub.id}
                                onClick={() => handleCardClick(sub.keyword)}
                                className={`group relative flex flex-col justify-between overflow-hidden rounded-none border-2 bg-white dark:bg-black transition-all duration-200 p-5 h-[120px] cursor-pointer
                                    ${isSelected
                                        ? 'border-[#FA4028] bg-[#FA4028]/5'
                                        : 'border-black dark:border-white hover:border-[#FA4028] group-hover:-translate-y-1'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className={`font-black font-mono text-lg uppercase tracking-tight transition-colors ${isSelected ? 'text-[#FA4028]' : 'text-black dark:text-white group-hover:text-[#FA4028]'}`}>
                                                {sub.keyword}
                                            </h3>
                                            <span className={`text-[10px] font-black font-mono px-2 py-0.5 rounded-none border ${isSelected ? 'bg-[#FA4028] border-[#FA4028] text-white' : 'bg-muted border-black dark:border-white text-black dark:text-white'}`}>
                                                {String(count).padStart(2, '0')}
                                            </span>
                                        </div>
                                        <div className="flex items-center text-[9px] font-black font-mono uppercase tracking-widest opacity-40">
                                            <Clock className="mr-1.5 h-3 w-3" />
                                            {sub.schedule_time?.substring(0, 5) || sub.schedule_time}
                                        </div>
                                    </div>

                                    <div className="flex gap-1 -mr-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 rounded-none text-black/20 dark:text-white/20 hover:text-blue-500 hover:bg-blue-500/5 transition-colors opacity-0 group-hover:opacity-100"
                                            onClick={(e) => openEditDialog(sub, e)}
                                        >
                                            <Edit2 className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 rounded-none text-black/20 dark:text-white/20 hover:text-[#FA4028] hover:bg-[#FA4028]/5 transition-colors opacity-0 group-hover:opacity-100"
                                            onClick={(e) => handleDelete(sub.id, e)}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        )
                    })}
                    {subscriptions.length === 0 && (
                        <div className="col-span-full text-center py-12 border-2 border-dashed border-black/10 dark:border-white/10 rounded-none bg-muted/30">
                            <p className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-30">NO_SUBSCRIPTIONS_FOUND</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
