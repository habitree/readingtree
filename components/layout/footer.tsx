/**
 * 푸터 컴포넌트
 */
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-muted-foreground">
            <p>© {currentYear} ReadTree. 읽은 모든 페이지가 자산이 되는 곳.</p>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">
              이용약관
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              개인정보처리방침
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              문의하기
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

