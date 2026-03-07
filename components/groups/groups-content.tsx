"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GroupCard } from "./group-card";
import { getGroups, getPublicGroups } from "@/app/actions/groups";
import { Loader2, Search, Users, Globe } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/lib/i18n";
import { grids } from "@/lib/design-tokens";

/**
 * 모임 목록 컨텐츠 컴포넌트
 * 내 모임과 공개 모임 검색 제공
 */
export function GroupsContent() {
  const { t } = useTranslation();
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
      toast.error(t("errors.loadError"));
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
      toast.error(t("errors.loadError"));
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
          <TabsTrigger value="my">{t("groups.myGroupsTab")}</TabsTrigger>
          <TabsTrigger value="public">{t("groups.publicGroupsTab")}</TabsTrigger>
        </TabsList>

        <TabsContent value="my" className="space-y-4">
          {myGroups.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <h4 className="font-semibold mb-2">{t("groups.noJoinedGroups")}</h4>
            </div>
          ) : (
            <div className={grids.threeCol}>
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
              placeholder={t("groups.searchGroups")}
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
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Globe className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                {searchQuery ? t("groups.noSearchResultsMsg") : t("groups.noPublicGroups")}
              </p>
            </div>
          ) : (
            <div className={grids.threeCol}>
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

