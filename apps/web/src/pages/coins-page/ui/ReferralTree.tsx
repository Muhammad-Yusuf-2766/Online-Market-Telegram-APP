import type { ReferralTreeNode } from '../../../app/parfumApi';

function NodeCircle({
  firstName,
  lastName,
}: {
  firstName: string | null;
  lastName: string | null;
}) {
  const label = [firstName, lastName].filter(Boolean).join(' ') || '?';
  const initials = label
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="referral-tree__node" title={label}>
      <span className="referral-tree__avatar">{initials}</span>
    </div>
  );
}

function TreeNode({
  node,
  depth,
  maxDepth,
}: {
  node: ReferralTreeNode;
  depth: number;
  maxDepth: number;
}) {
  const showChildren = node.children.length > 0 && depth < maxDepth;

  return (
    <div className="referral-tree__cell">
      <NodeCircle firstName={node.firstName} lastName={node.lastName} />
      {showChildren ? (
        <div className="referral-tree__subtree">
          <div className="referral-tree__connector referral-tree__connector--down" />
          <div className="referral-tree__row">
            {node.children.map((ch) => (
              <div key={ch.id} className="referral-tree__branch">
                <div className="referral-tree__connector referral-tree__connector--elbow" />
                <TreeNode node={ch} depth={depth + 1} maxDepth={maxDepth} />
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ReferralTree({ root, maxDepth }: { root: ReferralTreeNode; maxDepth: number }) {
  return (
    <div className="referral-tree">
      <TreeNode node={root} depth={0} maxDepth={maxDepth} />
    </div>
  );
}
