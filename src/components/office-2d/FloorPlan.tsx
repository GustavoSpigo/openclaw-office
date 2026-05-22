import { useMemo } from "react";
import type { VisualAgent } from "@/gateway/types";
import {
  SVG_WIDTH,
  SVG_HEIGHT,
  OFFICE,
  ZONES,
  ZONE_COLORS,
  ZONE_COLORS_DARK,
} from "@/lib/constants";
import { calculateDeskSlots } from "@/lib/position-allocator";
import { useOfficeStore } from "@/store/office-store";
import { detectMeetingGroups, calculateMeetingSeats } from "@/store/meeting-manager";
import { AgentAvatar } from "./AgentAvatar";
import { ConnectionLine } from "./ConnectionLine";
import { DeskUnit } from "./DeskUnit";
import { MeetingTable, Sofa, Plant, CoffeeCup, Chair } from "./furniture";
import { ZoneLabel } from "./ZoneLabel";

export function FloorPlan() {
  const agents = useOfficeStore((s) => s.agents);
  const links = useOfficeStore((s) => s.links);
  const theme = useOfficeStore((s) => s.theme);

  const agentList = Array.from(agents.values());
  const isDark = theme === "dark";
  const colors = isDark ? ZONE_COLORS_DARK : ZONE_COLORS;

  const deskAgents = useMemo(
    () => agentList.filter((a) => a.zone === "desk" && !a.isSubAgent && !a.movement && a.confirmed),
    [agentList],
  );
  const hotDeskAgents = useMemo(
    () => agentList.filter((a) => a.zone === "hotDesk" && !a.movement),
    [agentList],
  );
  const loungeAgents = useMemo(
    () => agentList.filter((a) => a.zone === "lounge" && !a.movement && !a.isPlaceholder),
    [agentList],
  );
  const meetingAgents = useMemo(
    () => agentList.filter((a) => a.zone === "meeting" && !a.movement && !a.isPlaceholder),
    [agentList],
  );
  const walkingAgents = useMemo(
    () => agentList.filter((a) => a.movement !== null && !a.isPlaceholder),
    [agentList],
  );
  const corridorAgents = useMemo(
    () => agentList.filter((a) => a.zone === "corridor" && !a.movement && !a.isPlaceholder),
    [agentList],
  );

  const maxSubAgents = useOfficeStore((s) => s.maxSubAgents);

  const deskSlots = useMemo(
    () => calculateDeskSlots(ZONES.desk, deskAgents.length, Math.max(deskAgents.length, 4)),
    [deskAgents.length],
  );

  const hotDeskSlots = useMemo(
    () =>
      calculateDeskSlots(
        ZONES.hotDesk,
        hotDeskAgents.length,
        Math.max(hotDeskAgents.length, maxSubAgents),
      ),
    [hotDeskAgents.length, maxSubAgents],
  );

  // 多桌渲染：用 detectMeetingGroups 的分组结果，每组渲染一张桌子
  const meetingGroups = useMemo(
    () => detectMeetingGroups(links, agents),
    [links, agents],
  );

  // 每组的座位分配（基于 agent.position，已由 store 的 moveToMeeting + allocateMeetingPositions 分配好）
  // 这里只需要知道每组有哪些 agent + 对应的 tableCenter 用于渲染桌子和椅子
  const meetingGroupTableData = useMemo(() => {
    const MEETING_ZONE = ZONES.meeting;
    const tableCenters = [
      { x: MEETING_ZONE.x + MEETING_ZONE.width / 2, y: MEETING_ZONE.y + MEETING_ZONE.height / 2 },
      {
        x: MEETING_ZONE.x + MEETING_ZONE.width * 0.3,
        y: MEETING_ZONE.y + MEETING_ZONE.height * 0.3,
      },
      {
        x: MEETING_ZONE.x + MEETING_ZONE.width * 0.7,
        y: MEETING_ZONE.y + MEETING_ZONE.height * 0.7,
      },
    ];
    return meetingGroups.map((group, i) => {
      const center = tableCenters[i % tableCenters.length];
      const seatsMap = calculateMeetingSeats(group, i);
      const agentsInGroup = group.agentIds
        .map((id) => agents.get(id))
        .filter((a): a is VisualAgent => a !== undefined);
      return { group, center, seatsMap, agentsInGroup };
    });
  }, [meetingGroups, agents]);

  // 默认的单桌圆心（无会议时展示空椅装饰用）
  const defaultMeetingCenter = {
    x: ZONES.meeting.x + ZONES.meeting.width / 2,
    y: ZONES.meeting.y + ZONES.meeting.height / 2,
  };

  return (
    <div className="relative h-full w-full bg-gray-100 dark:bg-gray-950">
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <filter id="building-shadow" x="-3%" y="-3%" width="106%" height="106%">
            <feDropShadow dx="0" dy="3" stdDeviation="6" floodOpacity={isDark ? 0.5 : 0.12} />
          </filter>
          {/* Wood plank pattern to give a ship deck look */}
          <pattern id="wood-planks" width="40" height="12" patternUnits="userSpaceOnUse">
            <rect width="40" height="12" fill={isDark ? "#3b2f23" : "#e7c79a"} />
            <line x1="0" y1="1" x2="40" y2="1" stroke={isDark ? "#2a1f16" : "#caa16a"} strokeWidth="0.6" opacity="0.55" />
            <line x1="0" y1="6" x2="40" y2="6" stroke={isDark ? "#2a1f16" : "#caa16a"} strokeWidth="0.5" opacity="0.35" />
            <line x1="0" y1="11" x2="40" y2="11" stroke={isDark ? "#2a1f16" : "#caa16a"} strokeWidth="0.6" opacity="0.4" />
          </pattern>
          {/* Sail / stripes accent for lounge wall */}
          <pattern id="sail-stripes" width="12" height="12" patternUnits="userSpaceOnUse">
            <rect width="12" height="12" fill={isDark ? "#0f172a" : "#f8fafc"} />
            <rect width="12" height="6" fill={isDark ? "#0b1220" : "#eef2ff"} opacity="0.06" />
          </pattern>
          {/* Mast vertical wood texture */}
          <pattern id="mast-wood" width="6" height="12" patternUnits="userSpaceOnUse">
            <rect width="6" height="12" fill={isDark ? "#5a3e2b" : "#a97450"} />
            <line x1="1" y1="0" x2="1" y2="12" stroke={isDark ? "#3b2f23" : "#8b5e3b"} strokeWidth="0.6" opacity="0.6" />
            <line x1="4" y1="0" x2="4" y2="12" stroke={isDark ? "#3b2f23" : "#8b5e3b"} strokeWidth="0.4" opacity="0.35" />
          </pattern>
          {/* Desaturate filter for lounge (removes color) */}
          <filter id="desaturate">
            <feColorMatrix type="saturate" values="0" />
          </filter>
        </defs>

        {/* ── Layer 0: Building shell (outer wall) ── */}
        {/* Ship hull / deck background */}
        <rect
          x={OFFICE.x}
          y={OFFICE.y}
          width={OFFICE.width}
          height={OFFICE.height}
          rx={OFFICE.cornerRadius}
          fill="url(#wood-planks)"
          stroke={isDark ? "#3b2f23" : "#7b5e3b"}
          strokeWidth={OFFICE.wallThickness}
          filter="url(#building-shadow)"
        />

        {/* ── Layer 1: Corridor floor tiles ── */}
        <CorridorFloor isDark={isDark} />

        {/* ── Layer 2: Zone floor fills ── */}
        {Object.entries(ZONES).map(([key, zone]) => (
          <rect
            key={`floor-${key}`}
            x={zone.x}
            y={zone.y}
            width={zone.width}
            height={zone.height}
            fill={
              // append '00' to hex color to make the zone fully transparent
              (colors[key as keyof typeof ZONE_COLORS] || "#000") + "00"
            }
          />
        ))}

        {/* ── Layer 3: Internal partition walls ── */}
        <PartitionWalls isDark={isDark} />

        {/* ── Layer 4: Door openings (overlaid on partitions) ── */}
        <DoorOpenings isDark={isDark} />

        {/* Zone labels */}
        {Object.entries(ZONES).map(([key, zone]) => (
          <ZoneLabel key={`label-${key}`} zone={zone} zoneKey={key as keyof typeof ZONES} />
        ))}

        {/* ── Layer 5: Furniture – Desk zone ── */}
        <DeskZoneFurniture deskSlots={deskSlots} deskAgents={deskAgents} />

        {/* ── Layer 5: Furniture – Meeting zone ── */}
        {meetingGroupTableData.length === 0 ? (
          // 无会议时：渲染默认单桌 + 6 空椅装饰
          <>
            <MeetingTable
              x={defaultMeetingCenter.x}
              y={defaultMeetingCenter.y}
              radius={60}
              isDark={isDark}
            />
            <MeetingChairs
              seats={[]}
              meetingAgentCount={0}
              tableCenter={defaultMeetingCenter}
              isDark={isDark}
            />
          </>
        ) : (
          // 有会议时：按分组渲染每桌
          meetingGroupTableData.map((tableData, i) => {
            const radius = Math.min(
              55 + tableData.agentsInGroup.length * 8,
              Math.min(ZONES.meeting.width, ZONES.meeting.height) / (meetingGroupTableData.length > 1 ? 3.5 : 2.3) - 20,
            );
            const seatPositions = tableData.agentsInGroup.map((a) => a.position);
            return (
              <g key={`meeting-table-group-${i}`}>
                <MeetingTable
                  x={tableData.center.x}
                  y={tableData.center.y}
                  radius={radius}
                  isDark={isDark}
                />
                <MeetingChairs
                  seats={seatPositions}
                  meetingAgentCount={tableData.agentsInGroup.length}
                  tableCenter={tableData.center}
                  isDark={isDark}
                />
              </g>
            );
          })
        )}

        {/* ── Layer 5: Furniture – Hot desk zone ── */}
        <HotDeskZoneFurniture slots={hotDeskSlots} agents={hotDeskAgents} />

        {/* ── Layer 5: Furniture – Lounge zone (incl. reception + entrance) ── */}
        <g filter="url(#desaturate)">
          <LoungeDecor isDark={isDark} />

          {/* ── Layer 5a: Lounge idle agents ── */}
          {loungeAgents.map((agent) => (
            <AgentAvatar key={`lounge-${agent.id}`} agent={agent} />
          ))}
        </g>

        {/* ── Layer 5b: Main entrance door on outer wall ── */}
        <EntranceDoor isDark={isDark} />

        {/* ── Layer 6: Collaboration lines ── */}
        {links.map((link) => {
          const source = agents.get(link.sourceId);
          const target = agents.get(link.targetId);
          if (!source || !target) return null;
          return (
            <ConnectionLine
              key={`${link.sourceId}-${link.targetId}`}
              x1={source.position.x}
              y1={source.position.y}
              x2={target.position.x}
              y2={target.position.y}
              strength={link.strength}
            />
          );
        })}

        {/* ── Layer 7: Meeting agents (seated) — 使用 agent.position（已由 moveToMeeting 分配好） ── */}
        {meetingAgents.map((agent) => (
          <AgentAvatar key={agent.id} agent={agent} />
        ))}

        {/* ── Layer 7b: Unconfirmed agents at entrance (semi-transparent) ── */}
        {corridorAgents.map((agent) => (
          <AgentAvatar key={`corridor-${agent.id}`} agent={agent} />
        ))}

        {/* ── Layer 8: Walking agents (above all zones, in corridor) ── */}
        {walkingAgents.map((agent) => (
          <AgentAvatar key={`walk-${agent.id}`} agent={agent} />
        ))}
      </svg>

      {/* Speaking indicators now rendered inside AgentAvatar SVG (SpeakingIndicator) */}
    </div>
  );
}

/* ═══ Sub-components ═══ */

/** Central cross-shaped corridor with tile pattern */
function CorridorFloor({ isDark }: { isDark: boolean }) {
  const cw = OFFICE.corridorWidth;
  const hCorrX = OFFICE.x;
  const hCorrY = OFFICE.y + (OFFICE.height - cw) / 2;
  const vCorrX = OFFICE.x + (OFFICE.width - cw) / 2;
  const vCorrY = OFFICE.y;

  return (
    <g>
      {/* Horizontal corridor */}
      <rect x={hCorrX} y={hCorrY} width={OFFICE.width} height={cw} fill="url(#wood-planks)" />
      {/* Vertical corridor */}
      <rect x={vCorrX} y={vCorrY} width={cw} height={OFFICE.height} fill="url(#wood-planks)" />
      {/* Corridor center guide lines */}
      <line
        x1={hCorrX}
        y1={hCorrY + cw / 2}
        x2={hCorrX + OFFICE.width}
        y2={hCorrY + cw / 2}
        stroke={isDark ? "#334155" : "#c8d0dc"}
        strokeWidth={0.5}
        strokeDasharray="8 6"
        opacity={0.6}
      />
      <line
        x1={vCorrX + cw / 2}
        y1={vCorrY}
        x2={vCorrX + cw / 2}
        y2={vCorrY + OFFICE.height}
        stroke={isDark ? "#334155" : "#c8d0dc"}
        strokeWidth={0.5}
        strokeDasharray="8 6"
        opacity={0.6}
      />
    </g>
  );
}

/** Internal partition walls between zones — double-line architectural style */
function PartitionWalls({ isDark }: { isDark: boolean }) {
  const wallColor = isDark ? "#475569" : "#8b9bb0";
  const fillColor = isDark ? "#334155" : "#c8d0dc";
  const wallW = 4;
  const cw = OFFICE.corridorWidth;
  const midX = OFFICE.x + (OFFICE.width - cw) / 2;
  const midY = OFFICE.y + (OFFICE.height - cw) / 2;

  // Render walls as filled rectangles for a proper architectural look
  const walls = [
    // Vertical walls (left of corridor)
    { x: midX - wallW / 2, y: OFFICE.y, w: wallW, h: midY - OFFICE.y },
    { x: midX - wallW / 2, y: midY + cw, w: wallW, h: OFFICE.y + OFFICE.height - midY - cw },
    // Vertical walls (right of corridor)
    { x: midX + cw - wallW / 2, y: OFFICE.y, w: wallW, h: midY - OFFICE.y },
    { x: midX + cw - wallW / 2, y: midY + cw, w: wallW, h: OFFICE.y + OFFICE.height - midY - cw },
    // Horizontal walls (above corridor)
    { x: OFFICE.x, y: midY - wallW / 2, w: midX - OFFICE.x, h: wallW },
    { x: midX + cw, y: midY - wallW / 2, w: OFFICE.x + OFFICE.width - midX - cw, h: wallW },
    // Horizontal walls (below corridor)
    { x: OFFICE.x, y: midY + cw - wallW / 2, w: midX - OFFICE.x, h: wallW },
    { x: midX + cw, y: midY + cw - wallW / 2, w: OFFICE.x + OFFICE.width - midX - cw, h: wallW },
  ];

  return (
    <g>
      {walls.map((w, i) => (
        <rect
          key={`wall-${i}`}
          x={w.x}
          y={w.y}
          width={w.w}
          height={w.h}
          fill={fillColor}
          stroke={wallColor}
          strokeWidth={0.5}
        />
      ))}
    </g>
  );
}

/** Door openings cut into partition walls */
function DoorOpenings({ isDark }: { isDark: boolean }) {
  const cw = OFFICE.corridorWidth;
  const midX = OFFICE.x + (OFFICE.width - cw) / 2;
  const midY = OFFICE.y + (OFFICE.height - cw) / 2;
  const doorWidth = 40;
  const doorColor = isDark ? ZONE_COLORS_DARK.corridor : ZONE_COLORS.corridor;
  const arcColor = isDark ? "#64748b" : "#94a3b8";

  // Door positions: where walls meet corridor, centered on each wall segment
  const doors = [
    // Top wall doors (into corridor)
    { cx: (OFFICE.x + midX) / 2, cy: midY, horizontal: true },
    { cx: (midX + cw + OFFICE.x + OFFICE.width) / 2, cy: midY, horizontal: true },
    // Bottom wall doors
    { cx: (OFFICE.x + midX) / 2, cy: midY + cw, horizontal: true },
    { cx: (midX + cw + OFFICE.x + OFFICE.width) / 2, cy: midY + cw, horizontal: true },
    // Left wall doors
    { cx: midX, cy: (OFFICE.y + midY) / 2, horizontal: false },
    { cx: midX + cw, cy: (OFFICE.y + midY) / 2, horizontal: false },
    // Right wall doors (below corridor)
    { cx: midX, cy: (midY + cw + OFFICE.y + OFFICE.height) / 2, horizontal: false },
    { cx: midX + cw, cy: (midY + cw + OFFICE.y + OFFICE.height) / 2, horizontal: false },
  ];

  return (
    <g>
      {doors.map((d, i) => {
        const half = doorWidth / 2;
        if (d.horizontal) {
          return (
            <g key={`door-${i}`}>
              {/* Erase wall segment */}
              <rect x={d.cx - half} y={d.cy - 3} width={doorWidth} height={6} fill={doorColor} />
              {/* Door swing arc */}
              <path
                d={`M ${d.cx - half} ${d.cy} A ${half} ${half} 0 0 1 ${d.cx + half} ${d.cy}`}
                fill="none"
                stroke={arcColor}
                strokeWidth={0.8}
                strokeDasharray="3 2"
                opacity={0.5}
              />
            </g>
          );
        }
        return (
          <g key={`door-${i}`}>
            <rect x={d.cx - 3} y={d.cy - half} width={6} height={doorWidth} fill={doorColor} />
            <path
              d={`M ${d.cx} ${d.cy - half} A ${half} ${half} 0 0 1 ${d.cx} ${d.cy + half}`}
              fill="none"
              stroke={arcColor}
              strokeWidth={0.8}
              strokeDasharray="3 2"
              opacity={0.5}
            />
          </g>
        );
      })}
    </g>
  );
}

function DeskZoneFurniture({
  deskSlots,
  deskAgents,
}: {
  deskSlots: Array<{ unitX: number; unitY: number }>;
  deskAgents: VisualAgent[];
}) {
  const agentBySlot = useMemo(() => {
    const map = new Map<number, VisualAgent>();
    for (const agent of deskAgents) {
      let hash = 0;
      for (let i = 0; i < agent.id.length; i++) {
        hash = ((hash << 5) - hash + agent.id.charCodeAt(i)) | 0;
      }
      const idx = Math.abs(hash) % deskSlots.length;
      let slot = idx;
      while (map.has(slot)) {
        slot = (slot + 1) % deskSlots.length;
      }
      map.set(slot, agent);
    }
    return map;
  }, [deskAgents, deskSlots.length]);

  return (
    <g>
      {deskSlots.map((slot, i) => (
        <DeskUnit
          key={`desk-${i}`}
          x={slot.unitX}
          y={slot.unitY}
          agent={agentBySlot.get(i) ?? null}
        />
      ))}
    </g>
  );
}

function HotDeskZoneFurniture({
  slots,
  agents,
}: {
  slots: Array<{ unitX: number; unitY: number }>;
  agents: VisualAgent[];
}) {
  return (
    <g>
      {slots.map((slot, i) => (
        <DeskUnit key={`hotdesk-${i}`} x={slot.unitX} y={slot.unitY} agent={agents[i] ?? null} />
      ))}
    </g>
  );
}

function MeetingChairs({
  seats,
  meetingAgentCount,
  tableCenter,
  isDark,
}: {
  seats: Array<{ x: number; y: number }>;
  meetingAgentCount: number;
  tableCenter: { x: number; y: number };
  isDark: boolean;
}) {
  if (meetingAgentCount > 0) {
    return (
      <g>
        {seats.map((s, i) => (
          <Chair key={`mc-${i}`} x={s.x} y={s.y} isDark={isDark} />
        ))}
      </g>
    );
  }

  const emptyCount = 6;
  const emptyRadius = 100;
  return (
    <g>
      {Array.from({ length: emptyCount }, (_, i) => {
        const angle = (2 * Math.PI * i) / emptyCount - Math.PI / 2;
        return (
          <Chair
            key={`mc-empty-${i}`}
            x={Math.round(tableCenter.x + Math.cos(angle) * emptyRadius)}
            y={Math.round(tableCenter.y + Math.sin(angle) * emptyRadius)}
            isDark={isDark}
          />
        );
      })}
    </g>
  );
}

function LoungeDecor({ isDark }: { isDark: boolean }) {
  const lz = ZONES.lounge;
  const cx = lz.x + lz.width / 2;

  const wallColor = isDark ? "#334155" : "#5a6878";
  const deskColor = isDark ? "#475569" : "#8494a7";
  const deskTop = isDark ? "#64748b" : "#a5b4c8";
  const logoTextColor = isDark ? "#94a3b8" : "#ffffff";
  const logoBg = isDark ? "#0b1220" : "#23405a";

  // Logo backdrop wall — centered horizontally, at ~55% from top
  const bgWallW = 200;
  const bgWallH = 36;
  const bgWallY = lz.y + lz.height * 0.52;

  // (old reception desk removed; decorations placed instead)
  // Mast & figurehead positions
  const mastX = lz.x + lz.width - 80;
  const mastTop = lz.y + 24;
  const mastBase = lz.y + lz.height - 12;
  const figureheadX = OFFICE.x + 14;
  const figureheadY = OFFICE.y + OFFICE.height / 2;

  return (
    <g>
      {/* ── Upper lounge area: sofas & coffee ── */}
      <Sofa x={lz.x + 100} y={lz.y + 60} rotation={0} isDark={isDark} />
      <Sofa x={lz.x + 280} y={lz.y + 60} rotation={0} isDark={isDark} />
      <Sofa x={lz.x + 100} y={lz.y + 140} rotation={180} isDark={isDark} />
      <CoffeeCup x={lz.x + 190} y={lz.y + 100} />
      <CoffeeCup x={lz.x + 100} y={lz.y + 100} />
      <Sofa x={lz.x + 440} y={lz.y + 100} rotation={90} isDark={isDark} />

      {/* ── Logo backdrop wall ── */}
      <rect
        x={cx - bgWallW / 2}
        y={bgWallY}
        width={bgWallW}
        height={bgWallH}
        rx={4}
        fill={logoBg}
      />
      {/* Wall top accent strip */}
      <rect
        x={cx - bgWallW / 2}
        y={bgWallY}
        width={bgWallW}
        height={3}
        rx={1.5}
        fill={isDark ? "#64748b" : "#7a9bc0"}
      />
      {/* Small Jolly Roger emblem (skull + crossbones + straw hat) */}
      <g transform={`translate(${cx - bgWallW / 2 + 28}, ${bgWallY + bgWallH / 2 + 2})`}>
        {/* Crossbones behind skull */}
        <g>
          <g transform="rotate(25)">
            <ellipse cx={0} cy={0} rx={12} ry={3.4} fill="#fff" />
            <circle cx={-12} cy={0} r={3.6} fill="#fff" />
            <circle cx={12} cy={0} r={3.6} fill="#fff" />
          </g>
          <g transform="rotate(-25)">
            <ellipse cx={0} cy={0} rx={12} ry={3.4} fill="#fff" />
            <circle cx={-12} cy={0} r={3.6} fill="#fff" />
            <circle cx={12} cy={0} r={3.6} fill="#fff" />
          </g>
        </g>
        <g transform="translate(0,-1)">
          <ellipse cx={0} cy={0} rx={10} ry={9} fill="#fff" stroke={isDark ? "#111827" : "#111"} strokeWidth={0.8} />
          <circle cx={-3} cy={-1} r={1.8} fill="#111" />
          <circle cx={3} cy={-1} r={1.8} fill="#111" />
          <rect x={-4.5} y={6} width={9} height={2} rx={1} fill="#111" />
          {/* Straw hat */}
          <ellipse cx={0} cy={-9} rx={12} ry={3.8} fill="#f6d76f" stroke="#d4a84e" />
          <rect x={-10} y={-11.2} width={20} height={4} rx={2} fill="#dc2626" />
        </g>
      </g>

      {/* "Going Merry" logo text */}
      <text
        x={cx}
        y={bgWallY + bgWallH / 2 + 6}
        textAnchor="middle"
        fill={logoTextColor}
        fontSize={14}
        fontWeight={700}
        fontFamily="system-ui, sans-serif"
        letterSpacing="0.08em"
      >
        Going Merry
      </text>

      {/* ── Ship wheel / helm near the logo ── */}
      <g transform={`translate(${cx}, ${bgWallY - 8})`}>
        <circle r={20} fill={deskColor} stroke={wallColor} strokeWidth={1} />
        <circle r={9} fill={deskTop} />
        {Array.from({ length: 8 }).map((_, i) => {
          const ang = (Math.PI * 2 * i) / 8;
          const x1 = Math.cos(ang) * 10;
          const y1 = Math.sin(ang) * 10;
          const x2 = Math.cos(ang) * 18;
          const y2 = Math.sin(ang) * 18;
          return (
            <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={wallColor} strokeWidth={2} strokeLinecap="round" />
          );
        })}
      </g>

      {/* ── Mast and Jolly Roger flag ── */}
      <g>
        <rect x={mastX - 6} y={mastTop} width={12} height={mastBase - mastTop} rx={6} fill="url(#mast-wood)" />
        {/* crow's nest */}
        <rect x={mastX - 18} y={mastTop + 36} width={36} height={10} rx={3} fill={deskColor} opacity={0.95} />
        {/* flag */}
        <g transform={`translate(${mastX + 12}, ${mastTop + 44}) rotate(6)`}>
          <rect x={0} y={0} width={68} height={44} rx={4} fill="#000" />
          <g transform="translate(34,22)">
            <g transform="rotate(22)">
              <ellipse cx={0} cy={0} rx={18} ry={4} fill="#fff" />
              <circle cx={-18} cy={0} r={4} fill="#fff" />
              <circle cx={18} cy={0} r={4} fill="#fff" />
            </g>
            <g transform="rotate(-22)">
              <ellipse cx={0} cy={0} rx={18} ry={4} fill="#fff" />
              <circle cx={-18} cy={0} r={4} fill="#fff" />
              <circle cx={18} cy={0} r={4} fill="#fff" />
            </g>
            <circle r={10} fill="#fff" stroke="#000" strokeWidth={0.8} />
            <circle cx={-3} cy={-1} r={1.6} fill="#000" />
            <circle cx={3} cy={-1} r={1.6} fill="#000" />
            <rect x={-5} y={7} width={10} height={2} rx={1} fill="#000" />
            <ellipse cx={0} cy={-10} rx={12} ry={3.5} fill="#f6d76f" stroke="#d4a84e" />
            <rect x={-8} y={-11.5} width={16} height={4} rx={2} fill="#dc2626" />
          </g>
        </g>
      </g>

      {/* Decorative plants flanking reception */}
      <Plant x={cx - bgWallW / 2 - 30} y={bgWallY + bgWallH / 2} />
      <Plant x={cx + bgWallW / 2 + 30} y={bgWallY + bgWallH / 2} />

      {/* Figurehead at bow (Going Merry style) */}
      <g transform={`translate(${figureheadX}, ${figureheadY})`}>
        <ellipse cx={0} cy={0} rx={18} ry={14} fill="#fff" stroke={isDark ? "#c0b0a0" : "#b0937d"} strokeWidth={1} />
        <circle cx={-6} cy={-2} r={2} fill="#111" />
        <circle cx={6} cy={-2} r={2} fill="#111" />
        <path d="M -8 6 Q 0 12 8 6" stroke={isDark ? "#8b6f5b" : "#8b6f5b"} fill="none" strokeWidth={1.2} />
        <rect x={-10} y={12} width={20} height={6} rx={3} fill="#dc2626" />
      </g>

      {/* Side plants near entrance */}
      <Plant x={lz.x + 40} y={lz.y + lz.height - 50} />
      <Plant x={lz.x + lz.width - 40} y={lz.y + lz.height - 50} />
    </g>
  );
}

/** Main entrance door cut into the bottom outer wall of lounge zone */
function EntranceDoor({ isDark }: { isDark: boolean }) {
  const lz = ZONES.lounge;
  const doorCX = lz.x + lz.width / 2;
  const doorY = OFFICE.y + OFFICE.height;
  const doorW = 70;
  const half = doorW / 2;

  const bgColor = isDark ? ZONE_COLORS_DARK.lounge : ZONE_COLORS.lounge;
  const arcColor = isDark ? "#64748b" : "#8b9bb0";
  const matColor = isDark ? "#374151" : "#b0a090";
  const textColor = isDark ? "#64748b" : "#94a3b8";

  return (
    <g>
      {/* Erase outer wall segment to create door opening */}
      <rect
        x={doorCX - half - 2}
        y={doorY - OFFICE.wallThickness - 1}
        width={doorW + 4}
        height={OFFICE.wallThickness + 4}
        fill={bgColor}
      />
      {/* Door frame posts */}
      <rect x={doorCX - half - 3} y={doorY - 10} width={3} height={12} rx={1} fill={arcColor} />
      <rect x={doorCX + half} y={doorY - 10} width={3} height={12} rx={1} fill={arcColor} />
      {/* Double-door swing arcs */}
      <path
        d={`M ${doorCX - half} ${doorY} A ${half} ${half} 0 0 0 ${doorCX} ${doorY - half}`}
        fill="none"
        stroke={arcColor}
        strokeWidth={0.8}
        strokeDasharray="4 3"
        opacity={0.5}
      />
      <path
        d={`M ${doorCX + half} ${doorY} A ${half} ${half} 0 0 1 ${doorCX} ${doorY - half}`}
        fill="none"
        stroke={arcColor}
        strokeWidth={0.8}
        strokeDasharray="4 3"
        opacity={0.5}
      />
      {/* Welcome mat */}
      <rect
        x={doorCX - 30}
        y={doorY - 18}
        width={60}
        height={12}
        rx={3}
        fill={matColor}
        opacity={0.5}
      />
      {/* "WELCOME ABOARD" label outside */}
      <text
        x={doorCX}
        y={doorY + 14}
        textAnchor="middle"
        fill={textColor}
        fontSize={9}
        fontWeight={700}
        fontFamily="system-ui, sans-serif"
        letterSpacing="0.12em"
      >
        WELCOME ABOARD
      </text>
    </g>
  );
}
