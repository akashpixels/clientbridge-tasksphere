import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const Index = () => {
  const stats = [
    {
      label: 'Active Projects',
      value: '12',
      icon: <Clock className="w-5 h-5 text-blue-500" />,
      change: '+2.5%',
      changeType: 'positive'
    },
    {
      label: 'Completed Tasks',
      value: '128',
      icon: <CheckCircle2 className="w-5 h-5 text-green-500" />,
      change: '+12.3%',
      changeType: 'positive'
    },
    {
      label: 'Overdue Tasks',
      value: '3',
      icon: <AlertCircle className="w-5 h-5 text-red-500" />,
      change: '-5.2%',
      changeType: 'negative'
    }
  ];

  return (
    <div className="container mx-auto p-6">
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold mb-6">Welcome back</h1>
        <p className="text-gray-500">Here's what's happening with your projects today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="p-6 hover-card shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <h3 className="text-2xl font-bold mt-2">{stat.value}</h3>
              </div>
              <div className="p-2 bg-gray-50 rounded-lg">
                {stat.icon}
              </div>
            </div>
            <div className="mt-4">
              <Progress value={65} className="h-1" />
            </div>
            <p className={cn(
              "text-sm mt-2",
              stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
            )}>
              {stat.change} from last month
            </p>
          </Card>
        ))}
      </div>

      <Card className="p-6 hover-card shadow-sm">
        <h2 className="font-display text-xl font-semibold mb-4">Recent Activity</h2>
        <div className="space-y-4">
          {[1, 2, 3].map((_, index) => (
            <div key={index} className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                {index + 1}
              </div>
              <div>
                <h3 className="font-medium">New project created</h3>
                <p className="text-sm text-gray-500">2 hours ago</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
       </div>
  );
};

export default Index;