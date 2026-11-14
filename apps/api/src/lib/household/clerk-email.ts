import { createClerkClient } from '@clerk/backend';

export async function getVerifiedPrimaryEmail(userId: string): Promise<string | null> {
    const user = await createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY }).users.getUser(userId);
    const email = user.emailAddresses.find(address => address.id === user.primaryEmailAddressId);
    return email?.verification?.status === 'verified' ? email.emailAddress.trim().toLowerCase() : null;
}
