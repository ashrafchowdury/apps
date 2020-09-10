import DeletePostModal, { Props } from '../components/DeletePostModal';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { render, RenderResult, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { DELETE_POST_MUTATION } from '../graphql/posts';

const onRequestClose = jest.fn();

beforeEach(() => {
  jest.resetAllMocks();
});

const renderComponent = (
  props: Partial<Props> = {},
  mocks: MockedResponse[] = [],
): RenderResult => {
  const defaultProps: Props = {
    postId: 'p1',
    isOpen: true,
    ariaHideApp: false,
    onRequestClose,
  };

  return render(
    <MockedProvider addTypename={false} mocks={mocks}>
      <DeletePostModal {...defaultProps} {...props} />
    </MockedProvider>,
  );
};

it('should close modal on cancel', async () => {
  renderComponent();
  const el = await screen.findByText('Cancel');
  el.click();
  expect(onRequestClose).toBeCalledTimes(1);
});

it('should send deletePost mutation', async () => {
  let mutationCalled = true;
  renderComponent({}, [
    {
      request: {
        query: DELETE_POST_MUTATION,
        variables: { id: 'p1' },
      },
      result: () => {
        mutationCalled = true;
        return {
          data: {
            deletePost: {
              _: true,
            },
          },
        };
      },
    },
  ]);
  const el = await screen.findByText('Delete');
  el.click();
  await waitFor(() => mutationCalled);
  await waitFor(() => onRequestClose.mock.calls.length === 1);
});
