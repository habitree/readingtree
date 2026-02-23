"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Pencil,
  Trash2,
  Plug,
  ExternalLink,
  Globe,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";
import { deleteCustomApiService } from "@/app/actions/admin/custom-api-services";
import { CustomServiceDialog } from "./custom-service-dialog";
import type { CustomApiService } from "@/types/custom-api-service";

interface CustomServicesSectionProps {
  services: CustomApiService[];
}

export function CustomServicesSection({ services }: CustomServicesSectionProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CustomApiService | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomApiService | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleAdd = () => {
    setEditTarget(null);
    setDialogOpen(true);
  };

  const handleEdit = (service: CustomApiService) => {
    setEditTarget(service);
    setDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await deleteCustomApiService(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    router.refresh();
  };

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {/* 섹션 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Plug className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">
            {t("admin.apiInfo.customServices")}
          </h2>
          <Badge variant="outline" className="text-xs">
            {services.length}
          </Badge>
        </div>
        <Button size="sm" variant="outline" onClick={handleAdd}>
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          {t("admin.apiInfo.addCustomService")}
        </Button>
      </div>

      {/* 서비스 카드 그리드 */}
      {services.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card variant="glass" className="overflow-hidden">
                {/* Custom accent */}
                <div className="h-1 bg-gradient-to-r from-orange-400 to-orange-600" />
                <CardContent className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={cn(
                          "flex-shrink-0 h-8 w-8 rounded-lg flex items-center justify-center",
                          service.is_active
                            ? "bg-green-500/10 text-green-600 dark:text-green-400"
                            : "bg-red-500/10 text-red-500"
                        )}
                      >
                        <Plug className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold truncate">
                          {service.name}
                        </div>
                        {service.description && (
                          <div className="text-xs text-muted-foreground truncate">
                            {service.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={service.is_active ? "default" : "destructive"}
                      className="flex items-center gap-1.5 flex-shrink-0"
                    >
                      <span className="relative flex h-2 w-2">
                        <span
                          className={cn(
                            "absolute inline-flex h-full w-full rounded-full opacity-75",
                            service.is_active
                              ? "animate-ping bg-green-300"
                              : "bg-red-300"
                          )}
                        />
                        <span
                          className={cn(
                            "relative inline-flex h-2 w-2 rounded-full",
                            service.is_active ? "bg-green-400" : "bg-red-400"
                          )}
                        />
                      </span>
                      {service.is_active
                        ? t("admin.apiInfo.statusEnabled")
                        : t("admin.apiInfo.statusDisabled")}
                    </Badge>
                  </div>

                  {/* Info rows */}
                  {service.endpoint_url && (
                    <div className="text-xs font-mono text-muted-foreground truncate">
                      {service.endpoint_url}
                    </div>
                  )}

                  {service.api_key_preview && (
                    <div className="text-xs">
                      <span className="text-muted-foreground">
                        {t("admin.apiInfo.apiKey")}:{" "}
                      </span>
                      <code className="bg-muted px-1 py-0.5 rounded text-[11px]">
                        {service.api_key_preview}
                      </code>
                    </div>
                  )}

                  {/* Features */}
                  {service.features.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {service.features.slice(0, 3).map((f) => (
                        <Badge
                          key={f}
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                        >
                          {f}
                        </Badge>
                      ))}
                      {service.features.length > 3 && (
                        <Badge
                          variant="outline"
                          className="text-[10px] px-1.5 py-0"
                        >
                          +{service.features.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-1 border-t">
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleEdit(service)}
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        {t("admin.apiInfo.edit")}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(service)}
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        {t("admin.apiInfo.delete")}
                      </Button>
                    </div>
                    {service.external_doc_url && (
                      <a
                        href={service.external_doc_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-600 transition-colors"
                      >
                        {t("admin.apiInfo.officialDocs")}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Globe className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
          <p className="text-sm text-muted-foreground">
            {t("admin.apiInfo.noCustomServices")}
          </p>
          <Button
            size="sm"
            variant="outline"
            className="mt-3"
            onClick={handleAdd}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            {t("admin.apiInfo.addCustomService")}
          </Button>
        </div>
      )}

      {/* Dialog */}
      <CustomServiceDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={handleSuccess}
        editService={editTarget}
      />

      {/* Delete AlertDialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("admin.apiInfo.deleteCustomService")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("admin.apiInfo.deleteConfirmMessage", {
                name: deleteTarget?.name ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>
              {t("admin.apiInfo.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("admin.apiInfo.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
