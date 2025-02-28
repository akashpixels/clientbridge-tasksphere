import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Clients = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Clients</h1>
      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">Active Clients</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          <div className="grid gap-4">
            {/* Client cards will go here */}
            <p>No active clients found.</p>
          </div>
        </TabsContent>
        <TabsContent value="archived">
          <div className="grid gap-4">
            {/* Archived client cards will go here */}
            <p>No archived clients found.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Clients;