"use client"
import { AreaChart, Bot, Calendar, ChartArea, GitGraph, Home, Hospital, Inbox, Search, Settings, Wallet } from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useRouter } from "next/navigation";

// Menu items.
const items = [
    {
        title: "Dashboard",
        url: "/components/dashboard",
        icon: Home,
    },
    {
        title: "Order List",
        url: "/components/orders",
        icon: Inbox,
    },
    {
        title: "Pathology",
        url: "/components/pathologies",
        icon: Hospital,
    },
    {
        title: "Wallet",
        url: "#",
        icon: Wallet,
    },
    {
        title: "Settings",
        url: "#",
        icon: Settings,
    },

]

export function AppSidebar() {
    const router = useRouter();
    return (
        <Sidebar>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="font-bold text-2xl mb-10">Arogyantra</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild>
                                        <div className="cursor-pointer" onClick={() => router.push(item.url)}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </div>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}
