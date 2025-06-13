"use client";
import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ref, onValue, get, update, push, set } from "firebase/database";
import { database } from "../Firebase";
import Script from "next/script";
import dynamic from "next/dynamic";
import Image from "next/image";

declare global {
    interface Window {
        google?: unknown;
    }
}

// Move interfaces to the top
interface Hospital {
    id: string;
    hid?: string;
    hospital_name?: string;
    name?: string;
    hospital_address?: string;
    address?: string;
    hospital_number?: string;
    number?: string;
    hospital_timing?: string;
    appointment_block_period?: string;
    coverage_area?: string;
    lat_log?: string;
    isOpen?: boolean;
}

interface Transaction {
    id: string;
    transactionKey?: string;
    userNumber?: string;
    totalAmount?: number;
    bookingTime?: string;
    arrivalTime?: string;
    status?: "pending" | "confirm" | "completed";
    uid?: string;
}

interface HospitalForm {
    name: string;
    address: string;
    number: string;
    openTime: string;
    closeTime: string;
    blockPeriodFrom: string;
    blockPeriodTo: string;
    coverageArea: string;
    latlog: string;
    isOpen: boolean;
}

const CareCarriagePage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<string>("orders");
    const [showForm, setShowForm] = useState<boolean>(false);
    const [hospitals, setHospitals] = useState<Hospital[]>([]);
    const [form, setForm] = useState<HospitalForm>({
        name: "",
        address: "",
        number: "",
        openTime: "",
        closeTime: "",
        blockPeriodFrom: "",
        blockPeriodTo: "",
        coverageArea: "",
        latlog: "",
        isOpen: true,
    });
    const [formError, setFormError] = useState<string>("");
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [hospitalsLoading, setHospitalsLoading] = useState<boolean>(true);
    const [hospitalsError, setHospitalsError] = useState<string>("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editBookingTime, setEditBookingTime] = useState<string>("");
    const [editBookingDate, setEditBookingDate] = useState<string>("");
    const [editStatus, setEditStatus] = useState<string>("pending");

    // Add state for address search modal
    const [showAddressSearchModal, setShowAddressSearchModal] = useState<boolean>(false);
    const [addressSearch, setAddressSearch] = useState<string>("");
    const [addressSearchLatLng, setAddressSearchLatLng] = useState<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        const ccRef = ref(database, "landlord/cc/transactions");
        const unsubscribe = onValue(
            ccRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    const txArray: Transaction[] = Object.keys(data).map((key) => ({
                        id: key,
                        ...data[key],
                    }));
                    setTransactions(txArray.reverse());
                } else {
                    setTransactions([]);
                }
                setLoading(false);
            },
            () => {
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        async function fetchHospitals() {
            setHospitalsLoading(true);
            setHospitalsError("");
            try {
                const hospitalsRef = ref(database, "care_carriage");
                const snapshot = await get(hospitalsRef);
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    const hospitalsArray: Hospital[] = Object.keys(data).map((key) => ({
                        id: key,
                        ...data[key],
                    }));
                    setHospitals(hospitalsArray);
                } else {
                    setHospitals([]);
                }
            } catch {
                setHospitalsError("Error loading hospitals.");
            }
            setHospitalsLoading(false);
        }
        fetchHospitals();
    }, []);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        if (type === "checkbox") {
            setForm((prev) => ({
                ...prev,
                [name]: (e.target as HTMLInputElement).checked,
            }));
        } else {
            setForm((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (
            typeof form.name !== 'string' || !form.name.trim() ||
            typeof form.address !== 'string' || !form.address.trim() ||
            typeof form.number !== 'string' || !form.number.trim() ||
            typeof form.openTime !== 'string' || !form.openTime.trim() ||
            typeof form.closeTime !== 'string' || !form.closeTime.trim() ||
            typeof form.blockPeriodFrom !== 'string' || !form.blockPeriodFrom.trim() ||
            typeof form.blockPeriodTo !== 'string' || !form.blockPeriodTo.trim() ||
            typeof form.coverageArea !== 'string' || !form.coverageArea.trim() ||
            typeof form.latlog !== 'string' || !form.latlog.trim()
        ) {
            setFormError("All fields are required.");
            return;
        }
        try {
            const hospitalsRef = ref(database, "care_carriage");
            const newHospitalRef = push(hospitalsRef);
            const hid = newHospitalRef.key;
            const hospitalData = {
                hid,
                hospital_name: form.name,
                hospital_address: form.address,
                hospital_number: form.number,
                hospital_timing: `${formatTime(form.openTime as string)} - ${formatTime(form.closeTime as string)}`,
                appointment_block_period: `${formatTime(form.blockPeriodFrom as string)} - ${formatTime(form.blockPeriodTo as string)}`,
                coverage_area: `${form.coverageArea} Km`,
                lat_log: form.latlog,
                isOpen: form.isOpen,
            };
            await set(newHospitalRef, hospitalData);
            try {
                const hospitalsSnapshot = await get(hospitalsRef);
                if (hospitalsSnapshot.exists()) {
                    const data = hospitalsSnapshot.val();
                    const hospitalsArray: Hospital[] = Object.keys(data).map((key) => ({
                        id: key,
                        ...data[key],
                    }));
                    setHospitals(hospitalsArray);
                } else {
                    setHospitals([]);
                }
            } catch {
                // Optionally handle fetch error
            }
            setForm({ name: "", address: "", number: "", openTime: "", closeTime: "", blockPeriodFrom: "", blockPeriodTo: "", coverageArea: "", latlog: "", isOpen: true });
            setFormError("");
            setShowForm(false);
        } catch {
            setFormError("Failed to register hospital. Please try again.");
        }
    };

    function formatTime(time: string) {
        if (!time) return "";
        const [hour, minute] = time.split(":");
        let h = parseInt(hour, 10);
        const ampm = h >= 12 ? "PM" : "AM";
        h = h % 12;
        if (h === 0) h = 12;
        return `${h.toString().padStart(2, '0')}:${minute} ${ampm}`;
    }

    async function updateBookingTimeWithStatus(id: string, newBookingTime: string, newStatus: string, newBookingDate: string) {
        // Use selected date and time
        const [yyyy, mm, dd] = newBookingDate.split('-');
        const isoBookingTime = `${yyyy}-${mm}-${dd}T${newBookingTime}:00.000`;
        // Calculate arrival time as booking time - 10 minutes
        const [hour, minute] = newBookingTime.split(":");
        const bookingDateObj = new Date(`${yyyy}-${mm}-${dd}T${hour}:${minute}:00`);
        bookingDateObj.setMinutes(bookingDateObj.getMinutes() - 10);
        const arrYYYY = bookingDateObj.getFullYear();
        const arrMM = String(bookingDateObj.getMonth() + 1).padStart(2, '0');
        const arrDD = String(bookingDateObj.getDate()).padStart(2, '0');
        const arrHour = String(bookingDateObj.getHours()).padStart(2, '0');
        const arrMinute = String(bookingDateObj.getMinutes()).padStart(2, '0');
        const isoArrivalTime = `${arrYYYY}-${arrMM}-${arrDD}T${arrHour}:${arrMinute}:00.000`;

        const tx = transactions.find(t => t.id === id);
        const uid = tx?.uid;
        try {
            const txRef = ref(database, `landlord/cc/transactions/${id}`);
            await update(txRef, {
                bookingTime: isoBookingTime,
                arrivalTime: isoArrivalTime,
                status: newStatus,
            });
            if (uid) {
                const userTxRef = ref(database, `users/${uid}/cc/${id}`);
                await update(userTxRef, {
                    bookingTime: isoBookingTime,
                    arrivalTime: isoArrivalTime,
                    status: newStatus,
                });
            }
        } catch {
            alert("Failed to update booking time or status in Firebase.");
        }
        // For now, just show the selected time in the correct format
        // alert(`Selected time (Flutter format): ${isoBookingTime}\nStatus: ${newStatus}`);
    }

    const GoogleMapReact = dynamic(() => import('google-map-react'), { ssr: false });

    const MapMarker: React.FC<{ lat: number; lng: number }> = () => (
        <div style={{ color: 'red', fontWeight: 'bold', fontSize: 24 }}>
            •
        </div>
    );

    return (
        <div className="p-6 w-full">
            <h1 className="text-2xl font-bold mb-4">Care Carriage</h1>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="mb-4">
                    <TabsTrigger value="orders">Orders</TabsTrigger>
                    <TabsTrigger value="hospitals">Hospitals</TabsTrigger>
                </TabsList>

                <TabsContent value="orders">
                    {loading ? (
                        <div className="text-center py-8">Loading transactions...</div>
                    ) : transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Image src="/file.svg" alt="No Data" width={96} height={96} className="w-24 h-24 mb-4 opacity-60" />
                            <div className="text-lg font-semibold text-gray-500">No transactions found.</div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto w-full">
                            <Table className="w-full min-w-[900px] max-w-full bg-white border border-gray-200 rounded-2xl shadow-2xl">
                                <TableHeader className="bg-gradient-to-r from-blue-50 to-blue-100 sticky top-0 z-10 rounded-t-2xl">
                                    <TableRow>
                                        <TableHead className="p-5 font-bold text-blue-900 text-base tracking-wide">ID</TableHead>
                                        <TableHead className="p-5 font-bold text-blue-900 text-base tracking-wide">User Number</TableHead>
                                        <TableHead className="p-5 font-bold text-blue-900 text-base tracking-wide">Total Amount</TableHead>
                                        <TableHead className="p-5 font-bold text-blue-900 text-base tracking-wide">Booking Time</TableHead>
                                        <TableHead className="p-5 font-bold text-blue-900 text-base tracking-wide">Arrival Time</TableHead>
                                        <TableHead className="p-5 font-bold text-blue-900 text-base tracking-wide">Status</TableHead>
                                        <TableHead className="p-5 font-bold text-blue-900 text-base tracking-wide">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.map((tx: Transaction, idx: number) => {
                                        let arrivalTime = '-';
                                        if (typeof tx.arrivalTime === 'string' && tx.arrivalTime) {
                                            arrivalTime = tx.arrivalTime;
                                        }
                                        return (
                                            <TableRow
                                                key={tx.id}
                                                className={`transition-all duration-200 ${idx % 2 === 0 ? 'bg-blue-50' : 'bg-white'} hover:scale-[1.01] hover:shadow-lg hover:bg-blue-100/60`}
                                            >
                                                <TableCell className="p-5 text-sm font-semibold text-gray-700">{String(tx.transactionKey || tx.id)}</TableCell>
                                                <TableCell className="p-5 text-sm text-gray-600">{String(tx.userNumber || "-")}</TableCell>
                                                <TableCell className="p-5 text-sm text-blue-700 font-bold">₹{typeof tx.totalAmount === 'string' ? tx.totalAmount : '-'}</TableCell>
                                                <TableCell className="p-5 text-sm text-gray-600">
                                                    {(() => {
                                                        const bookingTime = tx.bookingTime;
                                                        if (editingId === tx.id) {
                                                            // Show input and preview if editing
                                                            return (
                                                                <div>
                                                                    <input
                                                                        type="time"
                                                                        className="border rounded px-2 py-1 w-48 mb-1"
                                                                        value={editBookingTime}
                                                                        onChange={e => setEditBookingTime(e.target.value)}
                                                                    />
                                                                    {editBookingTime && editBookingDate && (() => {
                                                                        const [yyyy, mm, dd] = editBookingDate.split('-');
                                                                        const [hour, minute] = editBookingTime.split(":");
                                                                        const displayDate = `${dd} ${new Date(`${yyyy}-${mm}-01`).toLocaleString('en-US', { month: 'short' })} ${yyyy}`;
                                                                        let hourNum = parseInt(hour, 10);
                                                                        const ampm = hourNum >= 12 ? 'PM' : 'AM';
                                                                        hourNum = hourNum % 12;
                                                                        if (hourNum === 0) hourNum = 12;
                                                                        const displayTime = `${hourNum}:${minute} ${ampm}`;
                                                                        return (
                                                                            <div className="flex items-center gap-2 mt-1">
                                                                                <span className="inline-block w-2 h-2 rounded-full bg-blue-400"></span>
                                                                                <span className="text-xs font-mono bg-blue-50 px-2 py-1 rounded text-blue-900 border border-blue-200 shadow-sm">
                                                                                    {displayDate} {displayTime}
                                                                                </span>
                                                                                <span className="text-xs text-gray-500">(UI format)</span>
                                                                            </div>
                                                                        );
                                                                    })()}
                                                                </div>
                                                            );
                                                        } else if (typeof bookingTime === 'string' && bookingTime) {
                                                            // Format tx.bookingTime (ISO) to '11 Jun 2025 11:14 PM'
                                                            const dateObj = new Date(bookingTime);
                                                            const dd = String(dateObj.getDate()).padStart(2, '0');
                                                            const mmm = dateObj.toLocaleString('en-US', { month: 'short' });
                                                            const yyyy = dateObj.getFullYear();
                                                            const hour = dateObj.getHours();
                                                            const minute = String(dateObj.getMinutes()).padStart(2, '0');
                                                            const ampm = hour >= 12 ? 'PM' : 'AM';
                                                            let hour12 = hour % 12;
                                                            if (hour12 === 0) hour12 = 12;
                                                            const displayTime = `${hour12}:${minute} ${ampm}`;
                                                            return (
                                                                <span className="text-xs font-mono bg-blue-50 px-2 py-1 rounded text-blue-900 border border-blue-200 shadow-sm">
                                                                    {dd} {mmm} {yyyy} {displayTime}
                                                                </span>
                                                            );
                                                        } else {
                                                            return <span>-</span>;
                                                        }
                                                    })()}
                                                </TableCell>
                                                <TableCell className="p-5 text-sm text-gray-600">
                                                    {(() => {
                                                        const arrival = arrivalTime;
                                                        if (typeof arrival === 'string' && arrival !== '-') {
                                                            const dateObj = new Date(arrival);
                                                            const dd = String(dateObj.getDate()).padStart(2, '0');
                                                            const mmm = dateObj.toLocaleString('en-US', { month: 'short' });
                                                            const yyyy = dateObj.getFullYear();
                                                            const hour = dateObj.getHours();
                                                            const minute = String(dateObj.getMinutes()).padStart(2, '0');
                                                            const ampm = hour >= 12 ? 'PM' : 'AM';
                                                            let hour12 = hour % 12;
                                                            if (hour12 === 0) hour12 = 12;
                                                            const displayTime = `${hour12}:${minute} ${ampm}`;
                                                            return (
                                                                <span className="text-xs font-mono bg-blue-50 px-2 py-1 rounded text-blue-900 border border-blue-200 shadow-sm">
                                                                    {dd} {mmm} {yyyy} {displayTime}
                                                                </span>
                                                            );
                                                        } else {
                                                            return <span>-</span>;
                                                        }
                                                    })()}
                                                </TableCell>
                                                <TableCell className="p-5 text-sm">
                                                    {tx.status === "completed" ? (
                                                        <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold shadow">Completed</span>
                                                    ) : tx.status === "confirm" ? (
                                                        <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold shadow">Confirm</span>
                                                    ) : (
                                                        <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold shadow">Pending</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="p-5 text-sm">
                                                    <Dialog open={editingId === tx.id} onOpenChange={open => { if (!open) setEditingId(null); }}>
                                                        <DialogTrigger asChild>
                                                            <Button size="sm" onClick={() => {
                                                                setEditingId(tx.id);
                                                                setEditBookingTime(tx.bookingTime ? new Date(tx.bookingTime).toISOString().slice(11, 16) : "");
                                                                setEditBookingDate(tx.bookingTime ? new Date(tx.bookingTime).toISOString().slice(0, 10) : "");
                                                                setEditStatus(tx.status || "pending");
                                                            }}>Edit</Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>Edit Booking</DialogTitle>
                                                            </DialogHeader>
                                                            <form onSubmit={async e => {
                                                                e.preventDefault();
                                                                await updateBookingTimeWithStatus(tx.id, editBookingTime, editStatus, editBookingDate);
                                                                setEditingId(null);
                                                            }} className="space-y-4">
                                                                <div>
                                                                    <label className="block font-medium mb-1">Booking Date</label>
                                                                    <input
                                                                        type="date"
                                                                        className="w-full border rounded px-2 py-1 mb-1"
                                                                        value={editBookingDate}
                                                                        onChange={e => setEditBookingDate(e.target.value)}
                                                                        required
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block font-medium mb-1">Booking Time</label>
                                                                    <input
                                                                        type="time"
                                                                        className="w-full border rounded px-2 py-1 mb-1"
                                                                        value={editBookingTime}
                                                                        onChange={e => setEditBookingTime(e.target.value)}
                                                                        required
                                                                    />
                                                                    {editBookingTime && editBookingDate && (() => {
                                                                        const [yyyy, mm, dd] = editBookingDate.split('-');
                                                                        const [hour, minute] = editBookingTime.split(":");
                                                                        const displayDate = `${dd} ${new Date(`${yyyy}-${mm}-01`).toLocaleString('en-US', { month: 'short' })} ${yyyy}`;
                                                                        let hourNum = parseInt(hour, 10);
                                                                        const ampm = hourNum >= 12 ? 'PM' : 'AM';
                                                                        hourNum = hourNum % 12;
                                                                        if (hourNum === 0) hourNum = 12;
                                                                        const displayTime = `${hourNum}:${minute} ${ampm}`;
                                                                        return (
                                                                            <div className="flex items-center gap-2 mt-1">
                                                                                <span className="inline-block w-2 h-2 rounded-full bg-blue-400"></span>
                                                                                <span className="text-xs font-mono bg-blue-50 px-2 py-1 rounded text-blue-900 border border-blue-200 shadow-sm">
                                                                                    {displayDate} {displayTime}
                                                                                </span>
                                                                                <span className="text-xs text-gray-500">(UI format)</span>
                                                                            </div>
                                                                        );
                                                                    })()}
                                                                </div>
                                                                <div>
                                                                    <label className="block font-medium mb-1">Status</label>
                                                                    <select
                                                                        className="w-full border rounded px-2 py-1"
                                                                        value={editStatus}
                                                                        onChange={e => setEditStatus(e.target.value)}
                                                                    >
                                                                        <option value="pending">Pending</option>
                                                                        <option value="confirm">Confirm</option>
                                                                        <option value="completed">Completed</option>
                                                                    </select>
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <Button type="submit" size="sm">Save</Button>
                                                                    <Button type="button" size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                                                                </div>
                                                            </form>
                                                        </DialogContent>
                                                    </Dialog>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="hospitals">
                    <div className="flex w-full justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Hospitals</h2>
                        <Dialog open={showForm} onOpenChange={setShowForm}>
                            <DialogTrigger asChild>
                                <Button onClick={() => setShowForm(true)}>Add Hospital</Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                                <DialogHeader>
                                    <DialogTitle>Register Hospital</DialogTitle>
                                </DialogHeader>
                                <form className="space-y-8" onSubmit={handleFormSubmit}>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div>
                                            <label className="block font-semibold mb-2 text-gray-800">Hospital Name</label>
                                            <input
                                                className="w-full border border-blue-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-blue-50 placeholder-gray-400"
                                                type="text"
                                                name="name"
                                                value={form.name}
                                                onChange={handleFormChange}
                                                required
                                                minLength={2}
                                                maxLength={100}
                                                placeholder="Enter hospital name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-semibold mb-2 text-gray-800">Address</label>
                                            <input
                                                className="w-full border border-blue-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-blue-50 placeholder-gray-400 cursor-pointer"
                                                type="text"
                                                name="address"
                                                value={form.address}
                                                readOnly
                                                required
                                                minLength={5}
                                                maxLength={200}
                                                placeholder="Select address from map"
                                                onClick={() => {
                                                    setShowForm(false);
                                                    setTimeout(() => setShowAddressSearchModal(true), 200);
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-semibold mb-2 text-gray-800">Timing</label>
                                            <div className="flex gap-3 items-center">
                                                <div className="flex flex-col flex-1">
                                                    <span className="text-xs text-gray-500 mb-1">Open</span>
                                                    <input
                                                        className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-blue-50"
                                                        type="time"
                                                        name="openTime"
                                                        value={form.openTime || ''}
                                                        onChange={handleFormChange}
                                                        required
                                                    />
                                                </div>
                                                <span className="mx-1 text-gray-500 font-bold">to</span>
                                                <div className="flex flex-col flex-1">
                                                    <span className="text-xs text-gray-500 mb-1">Close</span>
                                                    <input
                                                        className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-blue-50"
                                                        type="time"
                                                        name="closeTime"
                                                        value={form.closeTime || ''}
                                                        onChange={handleFormChange}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block font-semibold mb-2 text-gray-800">Block Period</label>
                                            <div className="flex gap-3 items-center">
                                                <div className="flex flex-col flex-1">
                                                    <span className="text-xs text-gray-500 mb-1">From</span>
                                                    <input
                                                        className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-blue-50"
                                                        type="time"
                                                        name="blockPeriodFrom"
                                                        value={form.blockPeriodFrom || ''}
                                                        onChange={handleFormChange}
                                                        required
                                                    />
                                                </div>
                                                <span className="mx-1 text-gray-500 font-bold">to</span>
                                                <div className="flex flex-col flex-1">
                                                    <span className="text-xs text-gray-500 mb-1">To</span>
                                                    <input
                                                        className="w-full border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-blue-50"
                                                        type="time"
                                                        name="blockPeriodTo"
                                                        value={form.blockPeriodTo || ''}
                                                        onChange={handleFormChange}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block font-semibold mb-2 text-gray-800">Coverage Area (km)</label>
                                            <input
                                                className="w-full border border-blue-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-blue-50 placeholder-gray-400"
                                                type="number"
                                                name="coverageArea"
                                                value={form.coverageArea}
                                                onChange={handleFormChange}
                                                required
                                                min={1}
                                                max={1000}
                                                placeholder="e.g. 10"
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-semibold mb-2 text-gray-800">Number</label>
                                            <input
                                                className="w-full border border-blue-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-blue-50 placeholder-gray-400"
                                                type="number"
                                                name="number"
                                                value={form.number}
                                                onChange={handleFormChange}
                                                required
                                                minLength={10}
                                                maxLength={15}
                                                pattern="[0-9]+"
                                                placeholder="Enter contact number"
                                            />
                                        </div>
                                        <div>
                                            <label className="block font-semibold mb-2 text-gray-800">Lat/Long</label>
                                            <input
                                                className="w-full border border-blue-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-blue-50 placeholder-gray-400"
                                                type="text"
                                                name="latlog"
                                                value={form.latlog}
                                                readOnly
                                                required
                                                pattern="^-?\d{1,3}\.\d+,-?\d{1,3}\.\d+$"
                                                placeholder="e.g. 28.7041,77.1025 (Select from map)"
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 mt-6">
                                            <input
                                                type="checkbox"
                                                name="isOpen"
                                                checked={form.isOpen}
                                                onChange={handleFormChange}
                                                className="accent-blue-600"
                                            />
                                            <label className="font-medium">Open</label>
                                        </div>
                                    </div>
                                    {formError && <div className="text-red-500 text-sm">{formError}</div>}
                                    <Button type="submit" className="w-full">Register</Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                    {hospitalsLoading ? (
                        <div className="text-center py-8">Loading hospitals...</div>
                    ) : hospitalsError ? (
                        <div className="text-center text-red-500 py-8">{hospitalsError}</div>
                    ) : hospitals.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <Image src="/globe.svg" alt="No Hospitals" width={96} height={96} className="w-24 h-24 mb-4 opacity-60" />
                            <div className="text-lg font-semibold text-gray-500">No hospitals found.</div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                            {hospitals.map((hosp) => (
                                <Card key={hosp.id} className="shadow-xl border-0 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl hover:scale-[1.02] hover:shadow-2xl transition-transform duration-200">
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-xl font-bold text-blue-900 flex items-center gap-2">
                                            <span className="inline-block w-2 h-2 rounded-full bg-blue-400"></span>
                                            {hosp.hospital_name || hosp.name}
                                        </CardTitle>
                                        <div className="text-sm text-gray-500 mt-1">
                                            {hosp.hospital_address || hosp.address}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-2 text-gray-700">
                                        <div className="flex items-center gap-2"><span className="font-semibold">Number:</span> {hosp.hospital_number || "N/A"}</div>
                                        <div className="flex items-center gap-2"><span className="font-semibold">Timing:</span> {hosp.hospital_timing || "N/A"}</div>
                                        <div className="flex items-center gap-2"><span className="font-semibold">Block Period:</span> {hosp.appointment_block_period || "N/A"}</div>
                                        <div className="flex items-center gap-2"><span className="font-semibold">Coverage Area:</span> {hosp.coverage_area || "N/A"}</div>
                                        {/* <div className="flex items-center gap-2"><span className="font-semibold">Lat/Long:</span> {hosp.lat_log || "N/A"}</div> */}
                                        <div className="flex items-center gap-2">
                                            <span className="font-semibold">Status:</span> {hosp.isOpen ? (
                                                <span className="ml-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold shadow">Open</span>
                                            ) : (
                                                <span className="ml-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-semibold shadow">Closed</span>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Address Search Modal */}
            {showAddressSearchModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-2xl w-full relative">
                        <h3 className="text-lg font-bold mb-2">Search Address</h3>
                        <div style={{ height: '400px', width: '100%', position: 'relative' }}>
                            {/* Search box overlayed on the map */}
                            <input
                                id="address-search-input"
                                className="absolute top-4 left-1/2 -translate-x-1/2 w-3/4 border border-blue-200 rounded-lg px-4 py-2 z-10 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white placeholder-gray-400 shadow"
                                type="text"
                                value={addressSearch}
                                onChange={e => setAddressSearch(e.target.value)}
                                placeholder="Search for a place"
                                autoComplete="off"
                                style={{ zIndex: 10 }}
                            />
                            <GoogleMapReact
                                bootstrapURLKeys={{ key: 'AIzaSyDRADDlCkPQOHDyZeIcJ9nDCfmo94eo7Ig' }}
                                defaultCenter={{ lat: 28.6139, lng: 77.2090 }}
                                defaultZoom={12}
                                center={addressSearchLatLng ? addressSearchLatLng : { lat: 28.6139, lng: 77.2090 }}
                            >
                                {addressSearchLatLng && <MapMarker lat={addressSearchLatLng.lat} lng={addressSearchLatLng.lng} />}
                            </GoogleMapReact>
                        </div>
                        <div className="mt-4 flex justify-end gap-2">
                            <Button type="button" onClick={() => {
                                setShowAddressSearchModal(false);
                                setTimeout(() => setShowForm(true), 200);
                            }}>Cancel</Button>
                            <Button type="button" onClick={() => {
                                if (addressSearch && addressSearchLatLng) {
                                    setForm(prev => ({ ...prev, address: addressSearch, latlog: `${addressSearchLatLng.lat},${addressSearchLatLng.lng}` }));
                                    setShowAddressSearchModal(false);
                                    setTimeout(() => setShowForm(true), 200);
                                }
                            }} disabled={!addressSearchLatLng}>Select</Button>
                        </div>
                        <Script
                            src={`https://maps.googleapis.com/maps/api/js?key=AIzaSyDRADDlCkPQOHDyZeIcJ9nDCfmo94eo7Ig&libraries=places`}
                            strategy="afterInteractive"
                            onLoad={() => {
                                if (
                                    typeof window !== "undefined" &&
                                    typeof window.google !== "undefined" &&
                                    typeof (window.google as { maps?: unknown }).maps !== "undefined" &&
                                    typeof (window.google as { maps: { places?: unknown } }).maps.places !== "undefined"
                                ) {
                                    const input = document.getElementById("address-search-input") as HTMLInputElement;
                                    if (input) {
                                        type AutocompleteType = {
                                            getPlace: () => {
                                                formatted_address?: string;
                                                geometry?: { location: { lat: () => number; lng: () => number } };
                                            };
                                            addListener: (event: string, handler: () => void) => void;
                                        };
                                        const AutocompleteConstructor = (window.google as { maps: { places: { Autocomplete: new (input: HTMLInputElement) => AutocompleteType } } }).maps.places.Autocomplete;
                                        const autocomplete = new AutocompleteConstructor(input);
                                        autocomplete.addListener("place_changed", function () {
                                            const place = autocomplete.getPlace();
                                            if (place.formatted_address) {
                                                setAddressSearch(place.formatted_address);
                                            }
                                            if (place.geometry && place.geometry.location) {
                                                setAddressSearchLatLng({ lat: place.geometry.location.lat(), lng: place.geometry.location.lng() });
                                            }
                                        });
                                    }
                                }
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default CareCarriagePage;
