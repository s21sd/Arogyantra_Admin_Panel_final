import { AreaChart, Bot, Calendar, ChartArea, GitGraph, Home, Inbox, Search, Settings, Wallet } from "lucide-react"

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

// Menu items.
const items = [
    {
        title: "Dashboard",
        url: "/components/dashboard",
        icon: Home,
    },
    {
        title: "Order List",
        url: "#",
        icon: Inbox,
    },
    {
        title: "Order Details",
        url: "#",
        icon: Calendar,
    },
    {
        title: "Customer",
        url: "#",
        icon: Search,
    },
    {
        title: "Analytics",
        url: "#",
        icon: ChartArea,
    },
    {
        title: "Chat",
        url: "#",
        icon: Bot,
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
                                        <a href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </a>
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
