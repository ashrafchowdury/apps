import React, { ReactElement, useContext, useMemo } from 'react';
import AuthContext from '../../contexts/AuthContext';
import FlagIcon from '../icons/Flag';
import { reportSquadMember } from '../../lib/constants';
import { IconSize } from '../Icon';
import {
  SourceMember,
  SourceMemberRole,
  SourcePermissions,
  Squad,
} from '../../graphql/sources';
import BlockIcon from '../icons/Block';
import { StarIcon, UserIcon } from '../icons';
import SquadIcon from '../icons/Squad';
import { usePrompt } from '../../hooks/usePrompt';
import { UserShortInfo } from '../profile/UserShortInfo';
import { ModalSize } from '../modals/common/types';
import { ContextMenu, MenuItemProps } from '../fields/PortalMenu';
import { UseSquadActions } from '../../hooks/squads/useSquadActions';
import { verifyPermission } from '../../graphql/squads';
import { useToastNotification } from '../../hooks/useToastNotification';

interface SquadMemberMenuProps extends Pick<UseSquadActions, 'onUpdateRole'> {
  squad: Squad;
  member: SourceMember;
}

enum MenuItemTitle {
  PromoteToAdmin = 'Make admin',
  PromoteToModerator = 'Promote to moderator',
  DemoteToModerator = 'Demote to moderator',
  DemoteToMember = 'Demote to member',
  BlockMember = 'Block member',
}

const promptDescription: Record<
  MenuItemTitle,
  (memberName: string, squadName: string) => string
> = {
  [MenuItemTitle.PromoteToAdmin]: (memberName, squadName) =>
    `${memberName} will get the same permissions as you have. Making someone an admin will not replace you as the admin of ${squadName}. You can reverse this decision later.`,
  [MenuItemTitle.PromoteToModerator]: (memberName) =>
    `${memberName} will now get moderator permissions and be able to remove posts and members from your Squad. You can reverse this decision later.`,
  [MenuItemTitle.DemoteToModerator]: (memberName) =>
    `${memberName} will no longer have admin permissions. You can always reverse this decision later.`,
  [MenuItemTitle.DemoteToMember]: (memberName) =>
    `${memberName} will lose the moderator permissions and become a regular member.`,
  [MenuItemTitle.BlockMember]: (memberName, squadName) =>
    `${memberName} will be blocked and will no longer have access to ${squadName}. They will not be able to rejoin unless you unblock them.`,
};

const toastDescription: Partial<Record<MenuItemTitle, string>> = {
  [MenuItemTitle.BlockMember]: 'Member has been blocked',
};

type UpdateRoleFn = (
  role: SourceMemberRole,
  title: MenuItemTitle,
) => Promise<void>;

const getUpdateRoleOptions = (
  member: SourceMember,
  getUpdateRoleFn: (
    role: SourceMemberRole,
    title: MenuItemTitle,
  ) => UpdateRoleFn,
): MenuItemProps<Promise<unknown>>[] => {
  const promoteToAdmin = {
    label: MenuItemTitle.PromoteToAdmin,
    icon: <StarIcon size={IconSize.Small} />,
    action: getUpdateRoleFn(
      SourceMemberRole.Admin,
      MenuItemTitle.PromoteToAdmin,
    ),
  };
  const promoteToModerator = {
    label: MenuItemTitle.PromoteToModerator,
    icon: <UserIcon size={IconSize.Small} />,
    action: getUpdateRoleFn(
      SourceMemberRole.Moderator,
      MenuItemTitle.PromoteToModerator,
    ),
  };
  const demoteToModerator = {
    label: MenuItemTitle.DemoteToModerator,
    icon: <BlockIcon size={IconSize.Small} />,
    action: getUpdateRoleFn(
      SourceMemberRole.Moderator,
      MenuItemTitle.DemoteToModerator,
    ),
  };
  const demoteToMember = {
    label: MenuItemTitle.DemoteToMember,
    icon: <SquadIcon size={IconSize.Small} />,
    action: getUpdateRoleFn(
      SourceMemberRole.Member,
      MenuItemTitle.DemoteToMember,
    ),
  };

  if (member.role === SourceMemberRole.Admin) {
    return [demoteToModerator, demoteToMember];
  }

  if (member.role === SourceMemberRole.Moderator) {
    return [promoteToAdmin, demoteToMember];
  }

  return [promoteToAdmin, promoteToModerator];
};

export default function SquadMemberMenu({
  squad,
  member,
  onUpdateRole,
}: SquadMemberMenuProps): ReactElement {
  const { user } = useContext(AuthContext);
  const { showPrompt } = usePrompt();
  const { displayToast } = useToastNotification();
  const onUpdateMember = async (
    role: SourceMemberRole,
    title: MenuItemTitle,
  ) => {
    const hasConfirmed = await showPrompt({
      title: `${title}?`,
      description: promptDescription[title](member.user.name, squad.name),
      okButton: { title, className: 'btn-primary-cabbage' },
      content: (
        <UserShortInfo
          user={member.user}
          disableTooltip
          className={{
            container: 'py-3 px-6 justify-center',
            textWrapper: 'max-w-fit',
          }}
        />
      ),
      promptSize: ModalSize.Small,
      className: { buttons: 'mt-6' },
    });

    if (!hasConfirmed) return;

    await onUpdateRole({
      sourceId: squad.id,
      memberId: member.user.id,
      role,
    });

    if (toastDescription[title]) displayToast(toastDescription[title]);
  };

  const options: MenuItemProps[] = useMemo(() => {
    if (!member || !user) return [];

    const getUpdateRoleFn =
      (role: SourceMemberRole, title: MenuItemTitle) => () =>
        onUpdateMember(role, title);
    const menu: MenuItemProps[] = [];
    const canUpdateRole = verifyPermission(
      squad,
      SourcePermissions.MemberRoleUpdate,
    );

    if (canUpdateRole) {
      const memberOptions = getUpdateRoleOptions(member, getUpdateRoleFn);
      menu.push(...memberOptions);
    }

    menu.push({
      label: 'Report member',
      icon: <FlagIcon size={IconSize.Small} />,
      anchorProps: {
        href: `${reportSquadMember}#user_id=${user.id}&reportee_id=${member?.user.id}&squad_id=${squad.id}`,
        className: 'flex items-center w-full',
        rel: 'noopener noreferrer',
        target: '_blank',
      },
    });

    const canRemoveMember =
      canUpdateRole ||
      (verifyPermission(squad, SourcePermissions.MemberRemove) &&
        member.role === SourceMemberRole.Member);

    if (canRemoveMember) {
      menu.push({
        label: MenuItemTitle.BlockMember,
        icon: <BlockIcon size={IconSize.Small} />,
        action: getUpdateRoleFn(
          SourceMemberRole.Blocked,
          MenuItemTitle.BlockMember,
        ),
      });
    }

    return menu;
    // @NOTE see https://dailydotdev.atlassian.net/l/cp/dK9h1zoM
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member]);

  return <ContextMenu options={options} id="squad-member-menu-context" />;
}
