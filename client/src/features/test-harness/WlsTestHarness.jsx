// src/features/test-harness/WlsTestHarness.jsx
import React, { useState } from 'react';
import { WlsManagementPanel } from '../wls-management/components/WlsManagementPanel';
import { WlsAssessmentPanel } from '../wls-assessment/components/WlsAssessmentPanel';
import { CriteriaRuleEngine } from '../criteria-engine/components/CriteriaRuleEngine';

export function WlsTestHarness() {
  const [mockUsers] = useState([
    { _id: 'u1', name: 'User One', submissionUrls: ['https://drive.google.com/demo1'] },
    { _id: 'u2', name: 'User Two', submissionUrls: [], nonSubmissionReason: 'Medical Emergency' }
  ]);

  const [mockAdmins] = useState([
    { _id: 'a1', name: 'Admin Leader' }
  ]);

  const [sessions, setSessions] = useState([
    { _id: 's1', topicName: 'Session 1: Tafseer Basics', sessionDateTimeToronto: new Date(), status: 'ACTIVE' }
  ]);

  const [criteria, setCriteria] = useState([
    'Presentation - Light & Sound',
    'Arabic Reading',
    'Body Language'
  ]);

  return (
    <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '40px' }}>
      <h1>🛠️ Feature Test Suite</h1>
      
      <section>
        <h2>Test Step 1: Rule Engine</h2>
        <CriteriaRuleEngine initialCriteria={criteria} onSaveCriteria={setCriteria} />
      </section>

      <section>
        <h2>Test Step 2: WLS Management Creation & Deletion</h2>
        <WlsManagementPanel
          sessions={sessions}
          users={mockUsers}
          wlsAdmins={mockAdmins}
          onCreateSession={(newSess) => setSessions([...sessions, { ...newSess, _id: Date.now().toString(), status: 'ACTIVE' }])}
          onDeleteSession={(id) => setSessions(sessions.filter((s) => s._id !== id))}
        />
      </section>

      <section>
        <h2>Test Step 3: WLS Assessment Grading</h2>
        <WlsAssessmentPanel
          assignedUsers={mockUsers}
          criteriaList={criteria}
          onSubmitAssessment={(data) => alert(`Assessment Submitted: ${JSON.stringify(data)}`)}
        />
      </section>
    </div>
  );
}