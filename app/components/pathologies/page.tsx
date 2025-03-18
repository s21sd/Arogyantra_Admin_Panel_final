"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getDatabase, ref, onValue } from "firebase/database";
import { database } from "../Firebase";

const PathologyPage = () => {
    const [pathologies, setPathologies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const pathologyRef = ref(database, "pathology");

        const unsubscribe = onValue(
            pathologyRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    const data = snapshot.val();
                    const pathologyArray = Object.keys(data).map((key) => ({
                        id: key,
                        ...data[key],
                    }));
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

    if (loading) return <div className="text-center text-lg font-semibold">Loading...</div>;
    if (error) return <div className="text-red-500 text-center">{error}</div>;
    if (pathologies.length === 0) return <div className="text-center">No pathology data available.</div>;

    return (
        <div className="p-6 space-y-6 w-full">
            <h1 className="text-3xl font-bold">All Pathologies</h1>

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
                            {/* <TableHead className="p-4 font-semibold">Test Items</TableHead> */}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pathologies.map((pathology, index) => (
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
                                        <img src={pathology.certificate[0]?.img} alt={pathology.path_name} className="w-16 h-16 rounded-lg shadow-md" />
                                    )}
                                </TableCell>
                                {/* <TableCell className="p-4">
                                    <div className="flex flex-wrap gap-2">
                                        {pathology.testItems && pathology.testItems.length > 0 ? (
                                            pathology.testItems.map((item, index) => (
                                                <span key={index} className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                                                    {item.name}: ₹{item.price}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-gray-500">No Tests</span>
                                        )}
                                    </div>
                                </TableCell> */}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default PathologyPage;
