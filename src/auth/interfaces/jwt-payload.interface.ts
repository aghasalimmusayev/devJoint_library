import { Role } from '../../common/enums/role.enum';

export interface JwtPayload {
    sub: string;
    name: string;
    email: string;
    role: Role;
}
