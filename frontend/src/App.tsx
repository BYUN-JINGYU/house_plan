// 앱 뼈대: 비밀번호 → 문서 불러오기 → 계산 → 메뉴 띠 + 화면
import { useEffect, useState, type ReactNode } from 'react';
import { DataProvider, useSyncs } from './state/DataProvider';
import { ModelProvider, useModel } from './state/ModelProvider';
import { useDocSync } from './state/sync';
import { useAuth } from './state/useAuth';
import { Notice } from './ui/Notice';
import { Tabs } from './ui/Tabs';
import { AfterView } from './views/AfterView';
import { AssumeView } from './views/AssumeView';
import { ClosingView } from './views/ClosingView';
import { LedgerView } from './views/LedgerView';
import { LoginView } from './views/LoginView';
import { PersonView } from './views/PersonView';
import { Rail } from './views/Rail';
import { SummaryView } from './views/SummaryView';
import { tabFromHash, tabList, type TabId } from './views/tabs';
import { TodoView } from './views/TodoView';

function view(tab: TabId, go: (t: TabId) => void, onLogout?: () => void): ReactNode {
  switch (tab) {
    case 'summary': return <SummaryView go={go} />;
    case 'a': return <PersonView who="a" />;
    case 'b': return <PersonView who="b" />;
    case 'ledger': return <LedgerView />;
    case 'closing': return <ClosingView />;
    case 'after': return <AfterView />;
    case 'todo': return <TodoView />;
    case 'assume': return <AssumeView onLogout={onLogout} />;
  }
}

function Shell({ onLogout }: { onLogout?: () => void }) {
  const [tab, setTab] = useState<TabId>(() => tabFromHash(window.location.hash));
  const [plan] = useDocSync(useSyncs().plan);
  const { model } = useModel();
  useEffect(() => {
    const onHash = () => setTab(tabFromHash(window.location.hash));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const go = (id: TabId) => {
    window.history.replaceState(null, '', `#${id}`);
    setTab(id);
    window.scrollTo({ top: 0 });
  };
  return (
    <div className="shell">
      <Rail title={plan.title} s={model.s} onLogout={onLogout}>
        <Tabs tabs={tabList(plan.names)} current={tab} onSelect={go} />
      </Rail>
      <main className="content" id="panel" role="tabpanel" aria-labelledby={`tab-${tab}`} key={tab}>
        {view(tab, go, onLogout)}
      </main>
    </div>
  );
}

export function App() {
  const { state, open, login, logout } = useAuth();
  if (state === 'checking') return <Notice title="확인하는 중…" />;
  if (state === 'out') return <main className="login"><LoginView onLogin={login} /></main>;
  return (
    <>
      <DataProvider>
        <ModelProvider>
          <Shell onLogout={open ? undefined : () => void logout()} />
        </ModelProvider>
      </DataProvider>
      {state === 'expired' && (
        <div className="overlay" role="dialog" aria-modal="true" aria-label="다시 로그인">
          <LoginView onLogin={login} again />
        </div>
      )}
    </>
  );
}
