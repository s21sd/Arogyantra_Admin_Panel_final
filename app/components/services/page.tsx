"use client";
import React, { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ref, onValue, update } from "firebase/database";
import { database } from "../Firebase";

const ServicesPage = () => {
    const [pathologies, setPathologies] = useState<any>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);
    const [selectedPathology, setSelectedPathology] = useState<any>(null);

    useEffect(() => {
        const pathologyRef = ref(database, "pathology");
        const unsubscribe = onValue(
            pathologyRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    const pathologyArray = Object.keys(data)
                        .map((key) => ({
                            id: key,
                            ...data[key],
                        }))
                        .filter((p) => !p.verified); // Only unverified
                    setPathologies(pathologyArray);
                } else {
                    setError("No pathologies found.");
                }
                setLoading(false);
            },
            (err) => {
                setError("Failed to fetch data: " + err.message);
                setLoading(false);
            }
        );
        return () => unsubscribe();
    }, []);

    const handleVerify = async (id: string) => {
        await update(ref(database, `pathology/${id}`), { verified: true });
        setPathologies((prev: any[]) => prev.filter((p) => p.id !== id));
    };

    if (loading) return <div className="text-center text-lg font-semibold">Loading...</div>;
    if (error) return <div className="text-red-500 text-center">{error}</div>;
    if (pathologies.length === 0) return <div className="text-center">No unverified pathology data available.</div>;

    return (
        <div className="p-6 space-y-6 w-full">
            <h1 className="text-3xl font-bold">Unverified Pathologies</h1>
            <div className="flex justify-center w-full items-center mx-auto overflow-x-auto rounded-lg shadow-lg border border-gray-200">
                <Table className=" bg-white">
                    <TableHeader className="bg-gray-100">
                        <TableRow className="text-left text-gray-700">
                            <TableHead className="p-4 font-semibold">Name</TableHead>
                            <TableHead className="p-4 font-semibold">Phone</TableHead>
                            <TableHead className="p-4 font-semibold">Address</TableHead>
                            <TableHead className="p-4 font-semibold">Open Time</TableHead>
                            <TableHead className="p-4 font-semibold">Close Time</TableHead>
                            <TableHead className="p-4 font-semibold">Status</TableHead>
                            <TableHead className="p-4 font-semibold">Image</TableHead>
                            <TableHead className="p-4 font-semibold">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pathologies.map((pathology: any, index: number) => (
                            <TableRow key={pathology.id} className={index % 2 === 0 ? "bg-gray-50" : "bg-white"}>
                                <TableCell className="p-4 font-medium">{pathology.path_name || "Unknown Name"}</TableCell>
                                <TableCell className="p-4">{pathology.path_phoneNo || "N/A"}</TableCell>
                                <TableCell className="p-4">{pathology.path_address || "N/A"}</TableCell>
                                <TableCell className="p-4">{pathology.path_openTime || "N/A"}</TableCell>
                                <TableCell className="p-4">{pathology.path_closeTime || "N/A"}</TableCell>
                                <TableCell className="p-4">
                                    <span className={`px-3 py-1 rounded-lg text-white ${pathology.isOpen ? "bg-green-500" : "bg-red-500"}`}>
                                        {pathology.isOpen ? "Open" : "Closed"}
                                    </span>
                                </TableCell>
                                <TableCell className="p-4">
                                    {pathology.certificate && (
                                        <img src={pathology.certificate} alt={pathology.path_name} className="w-16 h-16 rounded-lg shadow-md" />
                                    )}
                                </TableCell>
                                <TableCell className="p-4 flex flex-col gap-2">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSelectedPathology(pathology)}
                                            >
                                                View Details
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl">
                                            <DialogHeader>
                                                <DialogTitle>Pathology Details</DialogTitle>
                                            </DialogHeader>
                                            {selectedPathology && (
                                                <div className="space-y-4">
                                                    <Card>
                                                        <CardHeader>
                                                            <CardTitle>{selectedPathology.path_name}</CardTitle>
                                                            <CardDescription>
                                                                <span className="font-semibold">Credential ID:</span> {selectedPathology.uid}
                                                            </CardDescription>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <div className="grid grid-cols-2 gap-4">
                                                                <div>
                                                                    <p><span className="font-semibold">Phone:</span> {selectedPathology.path_phoneNo}</p>
                                                                    <p><span className="font-semibold">Address:</span> {selectedPathology.path_address}</p>
                                                                    <p><span className="font-semibold">Open Time:</span> {selectedPathology.path_openTime}</p>
                                                                    <p><span className="font-semibold">Close Time:</span> {selectedPathology.path_closeTime}</p>
                                                                    <p><span className="font-semibold">Status:</span> {selectedPathology.isOpen ? "Open" : "Closed"}</p>
                                                                    <p><span className="font-semibold">Lat:</span> {selectedPathology.lat}</p>
                                                                    <p><span className="font-semibold">Lng:</span> {selectedPathology.lng}</p>
                                                                </div>
                                                                <div>
                                                                    {selectedPathology.certificate && (
                                                                        <Dialog>
                                                                            <DialogTrigger asChild>
                                                                                <img
                                                                                    src={selectedPathology.certificate}
                                                                                    alt={selectedPathology.path_name}
                                                                                    className="w-32 h-32 rounded-lg shadow-md mb-2 cursor-pointer transition-transform hover:scale-105"
                                                                                />
                                                                            </DialogTrigger>
                                                                            <DialogContent className="flex items-center justify-center bg-transparent shadow-none">
                                                                                <img
                                                                                    src={selectedPathology.certificate}
                                                                                    alt={selectedPathology.path_name}
                                                                                    className="max-w-[90vw] max-h-[80vh] rounded-lg border-4 border-white shadow-2xl"
                                                                                />
                                                                            </DialogContent>
                                                                        </Dialog>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                    <Card>
                                                        <CardHeader>
                                                            <CardTitle>Test Items</CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            {selectedPathology.tests && selectedPathology.tests.length > 0 ? (
                                                                <Table>
                                                                    <TableHeader>
                                                                        <TableRow>
                                                                            <TableHead>Test Name</TableHead>
                                                                            <TableHead>Price</TableHead>
                                                                        </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                        {selectedPathology.tests.map((test: any, idx: number) => (
                                                                            <TableRow key={idx}>
                                                                                <TableCell>{test.testName}</TableCell>
                                                                                <TableCell>{test.price}</TableCell>
                                                                            </TableRow>
                                                                        ))}
                                                                    </TableBody>
                                                                </Table>
                                                            ) : (
                                                                <p>No test items available.</p>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                    <Button
                                                        className="w-full"
                                                        onClick={() => handleVerify(selectedPathology.id)}
                                                    >
                                                        Mark as Verified
                                                    </Button>
                                                </div>
                                            )}
                                        </DialogContent>
                                    </Dialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default ServicesPage;