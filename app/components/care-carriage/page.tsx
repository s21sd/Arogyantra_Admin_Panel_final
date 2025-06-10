"use client";
import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ref, onValue, get, update } from "firebase/database";
import { database } from "../Firebase";

function isoToLocalDatetime(iso: string) {
    if (!iso) return "";
    const date = new Date(iso);
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function localDatetimeToISTIso(local: string) {
    if (!local) return '';
    const [datePart, timePart] = local.split('T');
    if (!datePart || !timePart) return '';
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    const localDate = new Date(year, month - 1, day, hour, minute);
    const istOffset = 5.5 * 60; // in minutes
    const utc = new Date(localDate.getTime() - (localDate.getTimezoneOffset() * 60000) + (istOffset * 60000));

    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00+05:30`;
}

const CareCarriagePage = () => {
    const [activeTab, setActiveTab] = useState("orders");
    const [showForm, setShowForm] = useState(false);
    const [hospitals, setHospitals] = useState<any[]>([]);
    const [form, setForm] = useState({
        name: "",
        address: "",
        number: "",
        timing: "",
        blockPeriod: "",
        coverageArea: "",
        latlog: "",
        isOpen: true,
    });
    const [formError, setFormError] = useState("");
    const [transactions, setTransactions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>("");
    const [hospitalsLoading, setHospitalsLoading] = useState(true);
    const [hospitalsError, setHospitalsError] = useState<string>("");
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editBookingTime, setEditBookingTime] = useState<string>("");
    const [editStatus, setEditStatus] = useState<string>("pending");

    useEffect(() => {
        const ccRef = ref(database, "landlord/cc/transactions");
        const unsubscribe = onValue(
            ccRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    const txArray = Object.keys(data).map((key) => ({
                        id: key,
                        ...data[key],
                    }));
                    setTransactions(txArray.reverse());
                } else {
                    setTransactions([]);
                }
                setLoading(false);
            },
            (err) => {
                setError("Failed to fetch transactions: " + err.message);
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
                    const hospitalsArray = Object.keys(data).map((key) => ({
                        id: key,
                        ...data[key],
                    }));
                    setHospitals(hospitalsArray);
                } else {
                    setHospitals([]);
                }
            } catch (e: any) {
                setHospitalsError("Error loading hospitals: " + e.message);
            }
            setHospitalsLoading(false);
        }
        fetchHospitals();
    }, []);

    const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (e.target instanceof HTMLInputElement && e.target.type === "checkbox") {
            setForm((prev) => ({
                ...prev,
                [name]: e.target.checked,
            }));
        } else {
            setForm((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.name.trim() || !form.address.trim() || !form.number.trim() || !form.timing.trim() || !form.blockPeriod.trim() || !form.coverageArea.trim() || !form.latlog.trim()) {
            setFormError("All fields are required.");
            return;
        }
        setHospitals((prev) => [
            ...prev,
            {
                id: `H${prev.length + 1}`,
                name: form.name,
                address: form.address,
                hospital_number: form.number,
                hospital_timing: form.timing,
                appointment_block_period: form.blockPeriod,
                coverage_area: form.coverageArea,
                lat_log: form.latlog,
                isOpen: form.isOpen,
            },
        ]);
        setForm({ name: "", address: "", number: "", timing: "", blockPeriod: "", coverageArea: "", latlog: "", isOpen: true });
        setFormError("");
        setShowForm(false);
    };

    async function updateBookingTime(id: string, newBookingTime: string) {
        const tx = transactions.find(t => t.id === id);
        const uid = tx?.uid;
        // Store as IST ISO string
        let isoBookingTime = newBookingTime;
        if (newBookingTime && !newBookingTime.endsWith('Z') && !newBookingTime.includes('+05:30')) {
            isoBookingTime = localDatetimeToISTIso(newBookingTime);
        }
        // Calculate new arrival time (10 mins before booking time, also as IST ISO string)
        let arrivalTime = "-";
        if (isoBookingTime && (isoBookingTime.endsWith('+05:30') || isoBookingTime.endsWith('Z'))) {
            // Parse as IST
            let date = new Date(new Date(isoBookingTime).getTime());
            if (!isNaN(date.getTime())) {
                date.setMinutes(date.getMinutes() - 10);
                arrivalTime = localDatetimeToISTIso(
                    `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}T${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
                );
            }
        }
        try {
            const txRef = ref(database, `landlord/cc/transactions/${id}`);
            await update(txRef, {
                bookingTime: isoBookingTime,
                arrivalTime: arrivalTime,
            });
            if (uid) {
                const userTxRef = ref(database, `users/${uid}/cc/${id}`);
                await update(userTxRef, {
                    bookingTime: isoBookingTime,
                    arrivalTime: arrivalTime,
                });
            }
        } catch (err) {
            alert("Failed to update booking time in Firebase.");
        }
    }

    async function updateBookingTimeWithStatus(id: string, newBookingTime: string, newStatus: string) {
        const tx = transactions.find(t => t.id === id);
        const uid = tx?.uid;
        let isoBookingTime = newBookingTime;
        if (newBookingTime && !newBookingTime.endsWith('Z') && !newBookingTime.includes('+05:30')) {
            isoBookingTime = localDatetimeToISTIso(newBookingTime);
        }
        let arrivalTime = "-";
        if (isoBookingTime && (isoBookingTime.endsWith('+05:30') || isoBookingTime.endsWith('Z'))) {
            let date = new Date(new Date(isoBookingTime).getTime());
            if (!isNaN(date.getTime())) {
                date.setMinutes(date.getMinutes() - 10);
                arrivalTime = localDatetimeToISTIso(
                    `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}T${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
                );
            }
        }
        const isCompleted = newStatus === "completed";
        try {
            const txRef = ref(database, `landlord/cc/transactions/${id}`);
            await update(txRef, {
                bookingTime: isoBookingTime,
                arrivalTime: arrivalTime,
                isCompleted: isCompleted,
            });
            if (uid) {
                const userTxRef = ref(database, `users/${uid}/cc/${id}`);
                await update(userTxRef, {
                    bookingTime: isoBookingTime,
                    arrivalTime: arrivalTime,
                    isCompleted: isCompleted,
                });
            }
        } catch (err) {
            alert("Failed to update booking time or status in Firebase.");
        }
    }

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
                    ) : error ? (
                        <div className="text-center text-red-500 py-8">{error}</div>
                    ) : transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <img src="/file.svg" alt="No Data" className="w-24 h-24 mb-4 opacity-60" />
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
                                    {transactions.map((tx, idx) => {
                                        let arrivalTime = '-';
                                        if (tx.bookingTime) {
                                            // Parse bookingTime as local (not UTC)
                                            const booking = new Date(tx.bookingTime);
                                            if (!isNaN(booking.getTime())) {
                                                booking.setMinutes(booking.getMinutes() - 10);
                                                // Format as 'YYYY-MM-DDTHH:mm:ss.sss' (same as bookingTime, but keep ms and no Z)
                                                const pad = (n: number) => n.toString().padStart(2, '0');
                                                arrivalTime = `${booking.getFullYear()}-${pad(booking.getMonth() + 1)}-${pad(booking.getDate())}T${pad(booking.getHours())}:${pad(booking.getMinutes())}:${pad(booking.getSeconds())}.000`;
                                            }
                                        }
                                        return (
                                            <TableRow
                                                key={tx.id}
                                                className={`transition-all duration-200 ${idx % 2 === 0 ? 'bg-blue-50' : 'bg-white'} hover:scale-[1.01] hover:shadow-lg hover:bg-blue-100/60`}
                                            >
                                                <TableCell className="p-5 text-sm font-semibold text-gray-700">{tx.transactionKey || tx.id}</TableCell>
                                                <TableCell className="p-5 text-sm text-gray-600">{tx.userNumber || "-"}</TableCell>
                                                <TableCell className="p-5 text-sm text-blue-700 font-bold">₹{tx.totalAmount || "-"}</TableCell>
                                                <TableCell className="p-5 text-sm text-gray-600">
                                                    {editingId === tx.id ? (
                                                        <input
                                                            type="datetime-local"
                                                            className="border rounded px-2 py-1 w-48"
                                                            value={editBookingTime}
                                                            onChange={e => setEditBookingTime(e.target.value)}
                                                        />
                                                    ) : (
                                                        <span>{tx.bookingTime || '-'}</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="p-5 text-sm text-gray-600">
                                                    <span>{arrivalTime || '-'}</span>
                                                </TableCell>
                                                <TableCell className="p-5 text-sm">
                                                    {tx.isCompleted ? (
                                                        <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold shadow">Completed</span>
                                                    ) : (
                                                        <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold shadow">Pending</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="p-5 text-sm">
                                                    <Dialog open={editingId === tx.id} onOpenChange={open => { if (!open) setEditingId(null); }}>
                                                        <DialogTrigger asChild>
                                                            <Button size="sm" onClick={() => {
                                                                setEditingId(tx.id);
                                                                setEditBookingTime(isoToLocalDatetime(tx.bookingTime || ""));
                                                                setEditStatus(tx.isCompleted ? "completed" : "pending");
                                                            }}>Edit</Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>Edit Booking</DialogTitle>
                                                            </DialogHeader>
                                                            <form onSubmit={async e => {
                                                                e.preventDefault();
                                                                await updateBookingTimeWithStatus(tx.id, editBookingTime, editStatus);
                                                                setEditingId(null);
                                                            }} className="space-y-4">
                                                                <div>
                                                                    <label className="block font-medium mb-1">Booking Time</label>
                                                                    <input
                                                                        type="datetime-local"
                                                                        className="w-full border rounded px-2 py-1"
                                                                        value={editBookingTime}
                                                                        onChange={e => setEditBookingTime(e.target.value)}
                                                                        required
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block font-medium mb-1">Status</label>
                                                                    <select
                                                                        className="w-full border rounded px-2 py-1"
                                                                        value={editStatus}
                                                                        onChange={e => setEditStatus(e.target.value)}
                                                                    >
                                                                        <option value="pending">Pending</option>
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
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Register Hospital</DialogTitle>
                                </DialogHeader>
                                <form className="space-y-4" onSubmit={handleFormSubmit}>
                                    <div>
                                        <label className="block font-medium mb-1">Hospital Name</label>
                                        <input
                                            className="w-full border rounded px-2 py-1"
                                            type="text"
                                            name="name"
                                            value={form.name}
                                            onChange={handleFormChange}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-medium mb-1">Address</label>
                                        <input
                                            className="w-full border rounded px-2 py-1"
                                            type="text"
                                            name="address"
                                            value={form.address}
                                            onChange={handleFormChange}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-medium mb-1">Number</label>
                                        <input
                                            className="w-full border rounded px-2 py-1"
                                            type="text"
                                            name="number"
                                            value={form.number}
                                            onChange={handleFormChange}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-medium mb-1">Timing</label>
                                        <input
                                            className="w-full border rounded px-2 py-1"
                                            type="text"
                                            name="timing"
                                            value={form.timing}
                                            onChange={handleFormChange}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-medium mb-1">Block Period</label>
                                        <input
                                            className="w-full border rounded px-2 py-1"
                                            type="text"
                                            name="blockPeriod"
                                            value={form.blockPeriod}
                                            onChange={handleFormChange}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-medium mb-1">Coverage Area</label>
                                        <input
                                            className="w-full border rounded px-2 py-1"
                                            type="text"
                                            name="coverageArea"
                                            value={form.coverageArea}
                                            onChange={handleFormChange}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block font-medium mb-1">Lat/Long</label>
                                        <input
                                            className="w-full border rounded px-2 py-1"
                                            type="text"
                                            name="latlog"
                                            value={form.latlog}
                                            onChange={handleFormChange}
                                            required
                                        />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            name="isOpen"
                                            checked={form.isOpen}
                                            onChange={handleFormChange}
                                            className="accent-blue-600"
                                        />
                                        <label className="font-medium">Open</label>
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
                            <img src="/globe.svg" alt="No Hospitals" className="w-24 h-24 mb-4 opacity-60" />
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
                                        <div className="text-sm text-gray-500 mt-1">{hosp.hospital_address || hosp.address}</div>
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
        </div>
    );
};

export default CareCarriagePage;
