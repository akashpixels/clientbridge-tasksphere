
import { Button } from "@/components/ui/button";
import { PlusCircle, FilePlus, FolderPlus } from "lucide-react";
import { useLayout } from "@/context/layout";
import { TaskCreationSidebar } from "@/components/tasks/TaskCreationSidebar";
import { CredentialCreationSidebar } from "@/components/projects/shared/CredentialCreationSidebar";
import { FileUploadSidebar } from "@/components/projects/shared/FileUploadSidebar";

export const TabActionButton = () => {
  const { currentTab, setRightSidebarContent } = useLayout();

  // Define button configuration based on current tab
  const getButtonConfig = () => {
    switch (currentTab) {
      case "tasks":
        return {
          label: "New Task",
          icon: <PlusCircle size={16} />,
          action: () => setRightSidebarContent(<TaskCreationSidebar />)
        };
      case "credentials":
        return {
          label: "Add Credential",
          icon: <FilePlus size={16} />,
          action: () => setRightSidebarContent(<CredentialCreationSidebar />)
        };
      case "files":
        return {
          label: "Add File",
          icon: <FolderPlus size={16} />,
          action: () => setRightSidebarContent(<FileUploadSidebar />)
        };
      default:
        return null;
    }
  };

  const buttonConfig = getButtonConfig();
  
  // Don't render anything if no button is configured for this tab
  if (!buttonConfig) return null;

  return (
    <Button onClick={buttonConfig.action} className="gap-2">
      {buttonConfig.icon} {buttonConfig.label}
    </Button>
  );
};

export default TabActionButton;
