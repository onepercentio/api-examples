import { apolloClient } from '../apollo-client';
import { login } from '../authentication/login';
import { explicitStart } from '../config';
import { getAddressFromSigner } from '../ethers.service';
import { OnchainQuoteRequest, QuoteOnchainDocument } from '../graphql/generated';
import { uploadIpfs } from '../ipfs';
import { waitUntilLensManagerTransactionIsComplete } from '../transaction/wait-until-complete';

const quoteOnChain = async (request: OnchainQuoteRequest) => {
  const result = await apolloClient.mutate({
    mutation: QuoteOnchainDocument,
    variables: {
      request,
    },
  });

  return result.data!.quoteOnchain;
};

export const QuoteOnChainLensProfileManager = async (profileId: string = '0x02') => {
  const address = getAddressFromSigner();
  console.log('quote onchain lens profile manager: address', address);

  await login(address);

  // TODO! USE METADATA PACKAGE FOR NICE TYPINGS
  const ipfsResult = await uploadIpfs<any>({
    $schema:
      'https://raw.githubusercontent.com/lens-protocol/LIPs/feat/metadata-standards/lens-metadata-standards/publication/text-only/1.0.0/schema.json',
    name: 'My text',
    description: 'My text Description',
    external_url: 'https://mytext.com',
    attributes: [],
    image: 'https://text.com/image.png',
    lens: {
      title: 'My text',
      id: '1030ee6e-51cb-4a09-a74a-abdccc6ef890',
      locale: 'en-US',
      mainContentFocus: 'TEXT_ONLY',
      content: 'My text Content',
      tags: ['text'],
      appId: 'my-app-id',
    },
  });
  console.log('quote onchain: ipfs result', ipfsResult);

  // TODO! in docs make sure we talk about onchain referrals
  const request: OnchainQuoteRequest = {
    quoteOn: '0x03-0x03',
    contentURI: `ipfs://${ipfsResult.path}`,
  };

  const result = await quoteOnChain(request);
  console.log('quote onchain lens profile manager: result', result);
  await waitUntilLensManagerTransactionIsComplete(result, 'unblock');
};

(async () => {
  if (explicitStart(__filename)) {
    await QuoteOnChainLensProfileManager();
  }
})();