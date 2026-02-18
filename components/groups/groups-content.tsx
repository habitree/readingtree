"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GroupCard } from "./group-card";
import { getGroups, getPublicGroups } from "@/app/actions/groups";
import { Loader2, Search } from "lucide-react";
import { toast } from "sonner";

/**
 * 모임 목록 컨텐츠 컴포넌트
 * 내 모임과 공개 모임 검색 제공
 */
export function GroupsContent() {
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [publicGroups, setPublicGroups] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("my");

  useEffect(() => {
    loadMyGroups();
  }, []);

  useEffect(() => {
    if (activeTab === "public") {
      loadPublicGroups();
    }
  }, [activeTab, searchQuery]);

  const loadMyGroups = async () => {
    try {
      const data = await getGroups();
      setMyGroups(data as any);
    } catch (error) {
      console.error("내 모임 로드 오류:", error);
      toast.error("모임 목록을 불러오지 못했어요.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadPublicGroups = async () => {
    setIsLoading(true);
    try {
      const data = await getPublicGroups(searchQuery || undefined);
      setPublicGroups(data as any);
    } catch (error) {
      console.error("공개 모임 로드 오류:", error);
      toast.error("공개 모임 목록을 불러오지 못했어요.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && activeTab === "my") {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="my">내 모임</TabsTrigger>
          <TabsTrigger value="public">공개 모임</TabsTrigger>
        </TabsList>

        <TabsContent value="my" className="space-y-4">
          {myGroups.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">참여한 모임이 없습니다.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {myGroups.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="public" className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="모임 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : publicGroups.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery ? "검색 결과가 없습니다." : "공개 모임이 없습니다."}
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {publicGroups.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

