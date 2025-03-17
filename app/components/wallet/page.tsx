"use client"
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const WalletPage = () => {
  const [amount, setAmount] = useState("");
  const [pathologyId, setPathologyId] = useState("");

  const handleSendMoney = () => {
    // API call to send money to the pathology
    console.log(`Sending ${amount} to pathology ID: ${pathologyId}`);
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Wallet</h1>

      {/* Revenue Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xl font-semibold">Total Revenue: ₹1,25,000</p>
          <p className="text-gray-500">Available Balance: ₹80,000</p>
        </CardContent>
      </Card>

      {/* Send Money Section */}
      <Card>
        <CardHeader>
          <CardTitle>Send Money to Pathology</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Pathology ID</Label>
            <Input
              type="text"
              placeholder="Enter Pathology ID"
              value={pathologyId}
              onChange={(e) => setPathologyId(e.target.value)}
            />
          </div>
          <div>
            <Label>Amount</Label>
            <Input
              type="number"
              placeholder="Enter Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <Button onClick={handleSendMoney} className="w-full">
            Send Money
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletPage;
