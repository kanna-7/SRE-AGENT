CREATE TABLE incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  service TEXT NOT NULL,
  severity TEXT CHECK (severity IN ('SEV-1','SEV-2','SEV-3','SEV-4')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open','diagnosing','remediating','resolved')),
  symptoms JSONB,
  root_cause TEXT,
  confidence_score FLOAT DEFAULT 0,
  recommended_fix TEXT,
  blast_radius TEXT,
  mttr_seconds INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE fixes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  success BOOLEAN,
  side_effects TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE timeline_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES incidents(id) ON DELETE CASCADE,
  event_type TEXT CHECK (event_type IN ('alert','deploy','log','metric','ai_diagnosis','human_action','resolution')),
  description TEXT,
  raw_data JSONB,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_incidents_service ON incidents(service);
CREATE INDEX idx_incidents_created ON incidents(created_at DESC);
CREATE INDEX idx_timeline_incident ON timeline_events(incident_id);

ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixes ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_all_incidents" ON incidents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_fixes" ON fixes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "public_all_timeline" ON timeline_events FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE incidents;
ALTER PUBLICATION supabase_realtime ADD TABLE timeline_events;
