import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Team = () => {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Team</h1>
      <Tabs defaultValue="members" className="w-full">
        <TabsList>
          <TabsTrigger value="members">Team Members</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
        </TabsList>
        <TabsContent value="members">
          <div className="grid gap-4">
            {/* Team member cards will go here */}
            <p>No team members found.</p>
          </div>
        </TabsContent>
        <TabsContent value="roles">
          <div className="grid gap-4">
            {/* Role cards will go here */}
            <p>No roles found.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Team;