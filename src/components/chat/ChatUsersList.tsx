
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import ChatUserItem from "./ChatUserItem";

// Mock data - will be replaced with real data in phase 2
const MOCK_USERS = [
  { id: "user1", name: "Agency Admin", role: "Admin", lastMessage: "Could you review the latest design?", time: "10:30 AM", unread: 2 },
  { id: "user2", name: "Client Manager", role: "Client", lastMessage: "Thanks for the update", time: "Yesterday", unread: 0 },
  { id: "user3", name: "Design Team", role: "Staff", lastMessage: "The assets are ready for review", time: "Yesterday", unread: 5 },
  { id: "user4", name: "Development Team", role: "Staff", lastMessage: "We'll deploy the changes tomorrow", time: "Monday", unread: 0 },
  { id: "user5", name: "Marketing Team", role: "Staff", lastMessage: "Campaign stats look good!", time: "Last week", unread: 0 },
];

interface ChatUsersListProps {
  onSelectUser: (userId: string) => void;
  selectedUserId: string | null;
}

const ChatUsersList: React.FC<ChatUsersListProps> = ({ onSelectUser, selectedUserId }) => {
  const [searchTerm, setSearchTerm] = useState("");
  
  const filteredUsers = MOCK_USERS.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search contacts"
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="divide-y">
          {filteredUsers.map(user => (
            <ChatUserItem
              key={user.id}
              user={user}
              isSelected={user.id === selectedUserId}
              onClick={() => onSelectUser(user.id)}
            />
          ))}
          
          {filteredUsers.length === 0 && (
            <div className="p-4 text-center text-muted-foreground">
              No contacts found
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default ChatUsersList;
