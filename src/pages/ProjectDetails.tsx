
import { useParams } from "react-router-dom";
import { useProjectData } from "@/hooks/useProjectData";
import RetainerLayout from "@/components/project-layouts/RetainerLayout";
import RegularLayout from "@/components/project-layouts/RegularLayout";
import FusionLayout from "@/components/project-layouts/FusionLayout";
import { HoursUsageProgress } from "@/components/projects/HoursUsageProgress";
import { intervalToHours } from "@/lib/date-utils";

// Layout registry to make adding new layouts easier
const LAYOUT_COMPONENTS = {
  RETAINER: RetainerLayout,
  REGULAR: RegularLayout,
  FUSION: FusionLayout,
};

const ProjectDetails = () => {
  const { id } = useParams();
  const { project, isLoading, error, selectedMonth, setSelectedMonth } = useProjectData(id);

  if (isLoading) {
    return <div className="container mx-auto p-6">Loading project details...</div>;
  }

  if (error || !project) {
    return <div className="container mx-auto p-6">Project not found</div>;
  }

  // Get subscription data for the HoursUsageProgress component
  const subscription = project?.project_subscriptions?.[0];
  const hoursAllotted = intervalToHours(subscription?.allocated_duration) || 0;
  const hoursSpent = intervalToHours(subscription?.actual_duration) || 0;
  
  // Prepare layout props
  const layoutProps = {
    project,
    selectedMonth,
    onMonthChange: setSelectedMonth,
    hoursUsageProgress: subscription ? (
      <HoursUsageProgress 
        hoursAllotted={hoursAllotted}
        hoursSpent={hoursSpent}
        selectedMonth={selectedMonth}
      />
    ) : null
  };
  
  // Get the layout type from the project
  const layoutType = project?.layout_type;
  
  // Find the appropriate layout component or use RetainerLayout as fallback
  const LayoutComponent = layoutType ? LAYOUT_COMPONENTS[layoutType] : RetainerLayout;
  
  // Render the layout with the appropriate props
  return <LayoutComponent {...layoutProps} />;
};

export default ProjectDetails;
