"use client";
import React, { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ref, onValue } from "firebase/database";
import { database } from "../Firebase";
import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Define a Pathology type and use it instead of any
interface Pathology {
    id: string;
    path_name: string;
    path_phoneNo: string;
    path_address: string;
    path_openTime: string;
    path_closeTime: string;
    verified: boolean;
    isOpen: boolean;
    certificate?: string;
    uid: string;
    lat: number;
    lng: number;
    tests?: { testName: string; price: number }[];
}

const PathologyPage = () => {
    const [pathologies, setPathologies] = useState<Pathology[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

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
                        .filter((p) => p.verified); // Only verified
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
    if (pathologies.length === 0) return <div className="text-center">No verified pathology data available.</div>;

    return (
        <div className="p-6 space-y-6 w-full">
            <h1 className="text-3xl font-bold">Pathologies</h1>
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
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pathologies.map((pathology: Pathology, index: number) => (
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
                                        <Image src={pathology.certificate} alt={pathology.path_name} width={64} height={64} className="rounded-lg shadow-md" />
                                    )}
                                </TableCell>
                                <TableCell className="p-4">
                                    <ArrowRight onClick={() => router.push(`/components/transactions/${pathology.uid || ""}`)} className="w-6 h-6 cursor-pointer text-gray-500" />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
};

export default PathologyPage;
