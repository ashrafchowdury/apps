import request, { gql } from 'graphql-request';
import { Connection, Upvote } from './common';
import { COMMENT_FRAGMENT, USER_SHORT_INFO_FRAGMENT } from './fragments';
import { EmptyResponse } from './emptyResponse';
import { UserShortProfile } from '../lib/user';
import { graphqlUrl } from '../lib/config';

export type ReportCommentReason =
  | 'HATEFUL'
  | 'HARASSMENT'
  | 'SPAM'
  | 'EXPLICIT'
  | 'MISINFORMATION'
  | 'OTHER';
export interface Author {
  __typename?: string;
  id: string;
  name: string;
  image: string;
  permalink: string;
  username: string;
  bio?: string;
}

export type Scout = Author;

export interface Comment {
  __typename?: string;
  id: string;
  content: string;
  contentHtml: string;
  createdAt: string;
  lastUpdatedAt?: string;
  author?: Author;
  permalink: string;
  upvoted?: boolean;
  numUpvotes: number;
  children?: Connection<Comment>;
}

export const getCommentHash = (id: string): string => `#c-${id}`;

export interface CommentUpvote extends Upvote {
  comment: Comment;
}

export interface RecommendedMentionsData {
  recommendedMentions: UserShortProfile[];
}

export const COMMENT_WITH_CHILDREN_FRAGMENT = gql`
  fragment CommentWithChildrenFragment on Comment {
    ...CommentFragment
    children {
      edges {
        node {
          ...CommentFragment
        }
      }
    }
  }
  ${COMMENT_FRAGMENT}
`;

export const RECOMMEND_MENTIONS_QUERY = gql`
  query RecommendedMentions(
    $postId: String
    $query: String
    $sourceId: String
  ) {
    recommendedMentions(postId: $postId, query: $query, sourceId: $sourceId) {
      ...UserShortInfo
    }
  }
  ${USER_SHORT_INFO_FRAGMENT}
`;

export interface PostCommentsData {
  postComments: Connection<Comment>;
}

export interface UserCommentsData {
  page: Connection<Comment>;
}

export const POST_COMMENTS_QUERY = gql`
  query PostComments($postId: ID!, $after: String, $first: Int) {
    postComments(postId: $postId, after: $after, first: $first) {
      edges {
        node {
          ...CommentWithChildrenFragment
        }
      }
    }
  }
  ${COMMENT_WITH_CHILDREN_FRAGMENT}
`;

export const USER_COMMENTS_QUERY = gql`
  query UserComments($userId: ID!, $after: String, $first: Int) {
    page: userComments(userId: $userId, after: $after, first: $first) {
      pageInfo {
        endCursor
        hasNextPage
      }
      edges {
        node {
          id
          content
          numUpvotes
          createdAt
          permalink
        }
      }
    }
  }
`;

export const COMMENT_UPVOTES_BY_ID_QUERY = gql`
  ${USER_SHORT_INFO_FRAGMENT}
  query CommentUpvotes($id: String!, $after: String, $first: Int) {
    upvotes: commentUpvotes(id: $id, after: $after, first: $first) {
      pageInfo {
        endCursor
        hasNextPage
      }
      edges {
        node {
          user {
            ...UserShortInfo
          }
        }
      }
    }
  }
`;

export const UPVOTE_COMMENT_MUTATION = gql`
  mutation UpvoteComment($id: ID!) {
    upvoteComment(id: $id) {
      _
    }
  }
`;

export const CANCEL_COMMENT_UPVOTE_MUTATION = gql`
  mutation CancelCommentUpvote($id: ID!) {
    cancelCommentUpvote(id: $id) {
      _
    }
  }
`;

export interface CommentOnData {
  comment: Comment;
}

export const COMMENT_ON_POST_MUTATION = gql`
  mutation COMMENT_ON_POST_MUTATION($id: ID!, $content: String!) {
    comment: commentOnPost(postId: $id, content: $content) {
      ...CommentFragment
    }
  }
  ${COMMENT_FRAGMENT}
`;

export const COMMENT_ON_COMMENT_MUTATION = gql`
  mutation COMMENT_ON_COMMENT_MUTATION($id: ID!, $content: String!) {
    comment: commentOnComment(commentId: $id, content: $content) {
      ...CommentFragment
    }
  }
  ${COMMENT_FRAGMENT}
`;

export const DELETE_COMMENT_MUTATION = gql`
  mutation DELETE_COMMENT_MUTATION($id: ID!) {
    deleteComment(id: $id) {
      _
    }
  }
`;

export const EDIT_COMMENT_MUTATION = gql`
  mutation EDIT_COMMENT_MUTATION($id: ID!, $content: String!) {
    comment: editComment(id: $id, content: $content) {
      ...CommentFragment
    }
  }
  ${COMMENT_FRAGMENT}
`;

export const PREVIEW_COMMENT_MUTATION = gql`
  query CommentPreview($content: String!, $sourceId: String) {
    preview: commentPreview(content: $content, sourceId: $sourceId)
  }
`;

export const REPORT_COMMENT_MUTATION = gql`
  mutation ReportComment(
    $commentId: ID!
    $reason: ReportCommentReason
    $note: String
  ) {
    reportComment(commentId: $commentId, reason: $reason, note: $note) {
      _
    }
  }
`;

export const deleteComment = (
  id: string,
  requestMethod: typeof request,
): Promise<EmptyResponse> => {
  return requestMethod(graphqlUrl, DELETE_COMMENT_MUTATION, {
    id,
  });
};
