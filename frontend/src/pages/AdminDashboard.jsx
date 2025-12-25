import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  Users,
  TrendingUp,
  XCircle,
  DollarSign,
  CheckCircle,
} from "lucide-react";

import { useSocket } from "@/context/SocketContext";
import { toast } from "sonner";

const statusColors = {
  Pending: "bg-yellow-100 text-yellow-800",
  Assigned: "bg-blue-100 text-blue-800",
  PickedUp: "bg-purple-100 text-purple-800",
  InTransit: "bg-orange-100 text-orange-800",
  Delivered: "bg-green-100 text-green-800",
  Failed: "bg-red-100 text-red-800",
};

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [parcels, setParcels] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedParcel, setSelectedParcel] = useState(null);
  const { socket } = useSocket();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on("parcel:new", () => {
        toast.info("New parcel booked!");
        fetchData();
      });

      socket.on("parcel:statusUpdate", () => {
        fetchData();
      });

      return () => {
        socket.off("parcel:new");
        socket.off("parcel:statusUpdate");
      };
    }
  }, [socket]);

  const fetchData = async () => {
    try {
      const [statsRes, parcelsRes, usersRes] = await Promise.all([
        api.get("/api/parcels/stats/dashboard"),
        api.get("/api/parcels"),
        api.get("/api/admin/users"),
      ]);

      setStats(statsRes.data.stats);
      setParcels(parcelsRes.data.parcels);

      // Filter only agents
      const agentUsers = usersRes.data.users.filter((u) => u.role === "agent");
      setAgents(agentUsers);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignAgent = async (parcelId, agentId) => {
    try {
      await api.put(`/api/parcels/${parcelId}/assign`, { agentId });
      fetchData();
      setSelectedParcel(null);
    } catch (error) {
      console.error("Failed to assign agent:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h1 className="text-xl font-bold">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-600">{user.name}</span>
            <Button variant="outline" size="sm" onClick={logout}>
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Total Parcels</p>
                  <p className="text-2xl font-bold">{stats.totalParcels}</p>
                </div>
                <Package className="h-8 w-8 text-slate-400" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Today Bookings</p>
                  <p className="text-2xl font-bold">{stats.todayBookings}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Pending</p>
                  <p className="text-2xl font-bold">{stats.pendingParcels}</p>
                </div>
                <Package className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Delivered Today</p>
                  <p className="text-2xl font-bold">{stats.deliveredToday}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Failed</p>
                  <p className="text-2xl font-bold">{stats.failedDeliveries}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">COD Amount</p>
                  <p className="text-2xl font-bold">৳{stats.codAmount}</p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="parcels" className="w-full">
          <TabsList>
            <TabsTrigger value="parcels">All Parcels</TabsTrigger>
            <TabsTrigger value="agents">Agents</TabsTrigger>
          </TabsList>

          <TabsContent value="parcels" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Parcel Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {parcels.map((parcel) => (
                    <div key={parcel._id} className="border rounded-lg p-4">
                      {console.log(parcel)}
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <span className="font-semibold">
                              {parcel.bookingId}
                            </span>
                            <Badge className={statusColors[parcel.status]}>
                              {parcel.status}
                            </Badge>
                          </div>

                          <div className="text-sm text-slate-600">
                            <p>
                              Customer: {parcel.customer?.name} (
                              {parcel.customer?.phone})
                            </p>
                            <p>
                              From: {parcel.pickupAddress.city} → To:{" "}
                              {parcel.deliveryAddress.city}
                            </p>
                            <p>
                              Size: {parcel.parcelSize} | Weight:{" "}
                              {parcel.weight}kg | {parcel.paymentMode}: ৳
                              {parcel.amount}
                            </p>
                            {parcel.agent && <p>Agent: {parcel.agent.name}</p>}
                          </div>
                        </div>

                        {parcel.status === "Pending" && (
                          <div className="ml-4">
                            {selectedParcel === parcel._id ? (
                              <div className="flex flex-col gap-2 min-w-50">
                                <select
                                  className="border rounded px-3 py-2 text-sm"
                                  onChange={(e) => {
                                    if (e.target.value) {
                                      handleAssignAgent(
                                        parcel._id,
                                        e.target.value
                                      );
                                    }
                                  }}
                                  defaultValue=""
                                >
                                  <option value="">Select Agent</option>
                                  {agents.map((agent) => (
                                    <option key={agent._id} value={agent._id}>
                                      {agent.name}
                                    </option>
                                  ))}
                                </select>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedParcel(null)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => setSelectedParcel(parcel._id)}
                              >
                                Assign Agent
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="agents">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {agents.map((agent) => (
                    <div key={agent._id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold">{agent.name}</p>
                          <p className="text-sm text-slate-600">
                            {agent.email}
                          </p>
                          <p className="text-sm text-slate-600">
                            {agent.phone}
                          </p>
                        </div>
                        <Badge variant="outline">Active</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
