"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Search, SortAsc, SortDesc } from "lucide-react"
import { useParams } from "next/navigation"
import { database } from "../../Firebase"
import { onValue, ref } from "firebase/database"

function TransactionList() {
    const { id } = useParams()
    const [transactions, setTransactions] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10
    useEffect(() => {
        if (!id) return;

        const transactionRef = ref(database, `pathology/${id}/transactions`);

        const unsubscribe = onValue(
            transactionRef,
            (snapshot) => {
                if (snapshot.exists()) {
                    // console.log("Fetched Transactions:", snapshot.val());
                    setTransactions(Object.values(snapshot.val() || {})); // Convert to array if necessary
                } else {
                    setTransactions([]);
                }
            },
            (error) => {
                console.error("Error fetching transactions:", error);
            }
        );

        return () => unsubscribe();
    }, [id]);

    console.log("Transactions:", transactions);

    const filteredTransactions = transactions.filter((transaction) => {
        const transactionKey = transaction.transactionKey?.toLowerCase() || "";
        const email = transaction.paymentDetails?.email?.toLowerCase() || "";
        const totalAmount = transaction.totalAmount?.toString() || "";

        return (
            transactionKey.includes(searchTerm.toLowerCase()) ||
            email.includes(searchTerm.toLowerCase()) ||
            totalAmount.includes(searchTerm)
        );
    });


    const sortedTransactions = [...filteredTransactions].sort((a, b) => {
        const dateA = new Date(a.initiatedAt).getTime()
        const dateB = new Date(b.initiatedAt).getTime()
        return sortOrder === "asc" ? dateA - dateB : dateB - dateA
    })

    // Paginate transactions
    const indexOfLastItem = currentPage * itemsPerPage
    const indexOfFirstItem = indexOfLastItem - itemsPerPage
    const currentTransactions = sortedTransactions.slice(indexOfFirstItem, indexOfLastItem)
    const totalPages = Math.ceil(sortedTransactions.length / itemsPerPage)

    // Toggle sort order
    const toggleSortOrder = () => {
        setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    }

    return (
        <div className="space-y-4 w-full mt-10">
            <Card>
                <CardHeader>
                    <CardTitle>Transactions</CardTitle>
                    <CardDescription>Manage and view all transaction records for pathology {id}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between mb-4">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search transactions..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" size="icon" onClick={toggleSortOrder}>
                            {sortOrder === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                        </Button>
                    </div>

                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Transaction ID</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {currentTransactions.length > 0 ? (
                                    currentTransactions.map((transaction) => {
                                        const date = new Date(transaction.initiatedAt)
                                        const formattedDate = date.toLocaleString()

                                        return (
                                            <TableRow key={transaction.transactionKey}>
                                                <TableCell className="font-medium">{transaction.transactionKey.substring(0, 10)}...</TableCell>
                                                <TableCell>{formattedDate}</TableCell>
                                                <TableCell>{transaction.paymentDetails.email}</TableCell>
                                                <TableCell>₹{transaction.totalAmount}</TableCell>
                                                <TableCell>
                                                    <span
                                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${transaction.paymentDetails.status === "captured"
                                                            ? "bg-green-100 text-green-800"
                                                            : "bg-yellow-100 text-yellow-800"
                                                            }`}
                                                    >
                                                        {transaction.paymentDetails.status}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Dialog>
                                                        <DialogTrigger asChild>
                                                            <Button variant="outline" size="sm">
                                                                View Details
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                                                            <DialogHeader>
                                                                <DialogTitle>Transaction Details</DialogTitle>
                                                            </DialogHeader>
                                                            <TransactionDetail transaction={transaction} />
                                                        </DialogContent>
                                                    </Dialog>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-4">
                                            No transactions found
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex items-center justify-end space-x-2 mt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                            >
                                Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Page {currentPage} of {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                            >
                                Next
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default TransactionList

function TransactionDetail({ transaction }: { transaction: any }) {
    const { paymentDetails, selectedTests } = transaction
    const date = new Date(transaction.initiatedAt)
    const formattedDate = date.toLocaleString()

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Transaction Details</CardTitle>
                    <CardDescription>Transaction ID: {transaction.transactionKey}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium">Initiated At</TableCell>
                                <TableCell>{formattedDate}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Address</TableCell>
                                <TableCell>{transaction.address}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Location</TableCell>
                                <TableCell>
                                    Lat: {transaction.lat}, Lng: {transaction.lng}
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Pathology ID</TableCell>
                                <TableCell>{transaction.pathologyId}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">User ID</TableCell>
                                <TableCell>{transaction.uid}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Total Amount</TableCell>
                                <TableCell>₹{transaction.totalAmount}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Payment Details</CardTitle>
                    <CardDescription>Payment ID: {paymentDetails.id}</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium">Customer</TableCell>
                                <TableCell>
                                    {paymentDetails.email} ({paymentDetails.contact})
                                </TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Amount</TableCell>
                                <TableCell>₹{paymentDetails.amount}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell className="font-medium">Status</TableCell>
                                <TableCell>
                                    <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${paymentDetails.status === "captured"
                                            ? "bg-green-100 text-green-800"
                                            : "bg-yellow-100 text-yellow-800"
                                            }`}
                                    >
                                        {paymentDetails.status}
                                    </span>
                                </TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Selected Tests</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Test Name</TableHead>
                                <TableHead className="text-right">Price (₹)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {selectedTests.map((test: any, index: number) => (
                                <TableRow key={index}>
                                    <TableCell>{test.name}</TableCell>
                                    <TableCell className="text-right">{test.price}</TableCell>
                                </TableRow>
                            ))}
                            <TableRow>
                                <TableCell className="font-bold">Total</TableCell>
                                <TableCell className="text-right font-bold">₹{transaction.totalAmount}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}