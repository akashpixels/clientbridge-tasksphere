import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Tasks = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Tasks</h1>
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Tasks</TabsTrigger>
          <TabsTrigger value="assigned">Assigned to Me</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        <TabsContent value="all">
          <div className="grid gap-4">
            {/* Task list will go here */}
            <p>No tasks found.</p>
          </div>
        </TabsContent>
        <TabsContent value="assigned">
          <div className="grid gap-4">
            {/* Assigned tasks will go here */}
            <p>No assigned tasks found.</p>
          </div>
        </TabsContent>
        <TabsContent value="completed">
          <div className="grid gap-4">
            {/* Completed tasks will go here */}
            <p>No completed tasks found.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Tasks;