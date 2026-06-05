import { useEffect } from "react";
import type { ForgeBranch, ForgeNode } from "../../domain/catalog";
import { layoutForgeTree } from "../../domain/catalog";
import type { ForgeRootGroup } from "../../domain/catalog";
import { ForgeTreeNode } from "./ForgeTreeNode";

export function ForgeTreeCanvas({
  group,
  onNodeClick,
}: {
  group: ForgeRootGroup;
  onNodeClick: (node: ForgeNode, branch?: ForgeBranch) => void;
}) {
  const layout = layoutForgeTree(group);
  const multi = group.branches.length > 1;

  return (
    <div className="paper-card overflow-hidden p-4">
      <div className="relative flex flex-col items-center">
        <div className="relative z-10">
          <ForgeTreeNode
            node={layout.root}
            onClick={() => onNodeClick(layout.root)}
          />
          {group.recraftable && (
            <p className="mt-1 text-center text-[10px] text-ink-soft">
              Basis · erneut schmiedbar
            </p>
          )}
        </div>

        {layout.columns.length > 0 && (
          <>
            <div className="my-2 h-4 w-0.5 bg-line-strong" aria-hidden />
            <div
              className={`grid w-full gap-x-2 gap-y-4 ${
                multi
                  ? `grid-cols-${Math.min(layout.columns.length, 3)}`
                  : "grid-cols-1 justify-items-center"
              }`}
              style={
                multi
                  ? {
                      gridTemplateColumns: `repeat(${layout.columns.length}, minmax(0, 1fr))`,
                    }
                  : undefined
              }
            >
              {layout.columns.map(({ branch, nodes }) => (
                <div
                  key={branch.id}
                  className={`flex flex-col items-center gap-3 ${
                    branch.locked ? "opacity-50" : ""
                  } ${branch.chosen ? "rounded-xl bg-ok-soft/10 p-2 ring-1 ring-ok/40" : ""}`}
                >
                  {nodes.length === 0 ? (
                    <BranchChip branch={branch} />
                  ) : (
                    nodes.map((node, i) => (
                      <div key={node.gear.id} className="flex flex-col items-center">
                        {i > 0 && (
                          <div className="mb-2 h-3 w-0.5 bg-line-strong" aria-hidden />
                        )}
                        {i === 0 && multi && <BranchChip branch={branch} />}
                        <ForgeTreeNode
                          node={node}
                          branch={multi ? undefined : branch}
                          onClick={() => onNodeClick(node, branch)}
                        />
                      </div>
                    ))
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function BranchChip({ branch }: { branch: ForgeBranch }) {
  if (branch.chosen) {
    return (
      <span className="mb-1 rounded-full bg-ok-soft px-2 py-0.5 text-[9px] font-bold text-ok">
        PFAD
      </span>
    );
  }
  if (branch.locked) {
    return (
      <span className="mb-1 rounded-full bg-paper-2 px-2 py-0.5 text-[9px] font-bold text-ink-soft">
        🔒
      </span>
    );
  }
  return null;
}

/** Lock body scroll while sheet is open. */
export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}
