import axios from 'axios';
import { COMMUNITY } from '../constants/api/asc.constant';

export class CommunityService {
  public async deleteUsersInCommunity(
    communityId: string,
    userIds: string[]
  ): Promise<any> {
    try {
      const response = await axios.delete(
        `${process.env.ASC_URL}/${COMMUNITY.DELETE_USERS.replace(':community_id', communityId)}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${process.env.ADMIN_TOKEN}`,
          },
          params: {
            userIds
          }
        }
      );

      return response.data;
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error.message;
      throw new Error(errorMessage);
    }
  }
}