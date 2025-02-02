import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Projects = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Projects</h1>
      <Tabs defaultValue="active" className="w-full">
        <TabsList>
          <TabsTrigger value="active">Active Projects</TabsTrigger>
          <TabsTrigger value="completed">Completed Projects</TabsTrigger>
        </TabsList>
        <TabsContent value="active">
          <div className="grid gap-4">
            {/* Project cards will go here */}
            <p>No active projects found.</p>
          </div>
        </TabsContent>
        <TabsContent value="completed">
          <div className="grid gap-4">
            {/* Completed project cards will go here */}
            <p>No completed projects found.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Projects;