"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, Home } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * 에러 UI - 함수형 컴포넌트로 분리하여 useTranslation 훅 사용
 */
function ErrorUI({ error, onReset }: { error: Error | null; onReset: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-16 w-16 text-destructive" />
          </div>
          <CardTitle className="text-2xl">{t("errorBoundary.title")}</CardTitle>
          <CardDescription>
            {t("errorBoundary.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === "development" && error && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium mb-1">{t("errorBoundary.errorDetail")}</p>
              <p className="text-xs text-muted-foreground break-all">
                {error.message}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button onClick={onReset} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              {t("errorBoundary.retry")}
            </Button>
            <Button
              onClick={() => window.location.href = "/"}
              variant="outline"
              className="w-full"
            >
              <Home className="mr-2 h-4 w-4" />
              {t("errorBoundary.goHome")}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            {t("errorBoundary.helpText")}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * 에러 바운더리 컴포넌트
 * 자식 컴포넌트에서 발생한 에러를 캐치하여 사용자 친화적인 에러 UI를 표시합니다.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 에러 로깅 (개발 환경에서만)
    if (process.env.NODE_ENV === "development") {
      console.error("에러 바운더리에서 에러 캐치:", error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // 커스텀 fallback이 제공된 경우 사용
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // 기본 에러 UI (함수형 컴포넌트로 위임)
      return <ErrorUI error={this.state.error} onReset={this.handleReset} />;
    }

    return this.props.children;
  }
}

