import * as jwt from 'jsonwebtoken'

import { DataEncryptor } from '../../utilities/DataEncryptor/DataEncryptor'
import { TokenValidator } from '../../adapters/TokenValidator/TokenValidator'

type RequestBody = {
  username?: string
  password?: string
  token?: string
}

type AdminModel = {
  findOne(where: object): AdminRow
}

type AdminRow = {
  password: string
  dataValues: { password: string }
}

type Token = {
  token?: string
}

type ResponseBody = {
  status: number
  message: string
  body: boolean
}

class AuthenticateAdminService {

  public static async authAdmin(reqBody: RequestBody, AdminModel: AdminModel): Promise<object> {
    const { username, password } = reqBody
    const adminRow: AdminRow = await AdminModel.findOne({ where: { username } })
    let token: Token = {}
    if (adminRow !== null) {
      token = await AuthenticateAdminService.checkIfPasswordsMatch(password, adminRow)
    }
    return token
  }
  
  private static async checkIfPasswordsMatch(plainPassword: string, adminRow: AdminRow): Promise<Token> {
    const isPasswordsMatch: boolean = await DataEncryptor.compare(plainPassword, adminRow.password)
    let token: Token = {}
    if (isPasswordsMatch) {
      const admin: object = AuthenticateAdminService.removePasswordPropFromAdminRow(adminRow)
      token = { token: AuthenticateAdminService.createToken(admin) }
    }
    return token
  }

  private static removePasswordPropFromAdminRow(adminRow: AdminRow): object {
    const { password, ...admin } = adminRow.dataValues
    return admin
  }

  private static createToken(admin: object): string {
    const token: string = jwt.sign({ admin }, 'expressadminarea')
    return token
  }

  public static async verifyToken(token: string, AdminModel: AdminModel): Promise<ResponseBody> {
    let isAdminExists: ResponseBody = { status: 404, message: 'Not Found', body: false }
    try {
      const username: string = (await TokenValidator.verify(token)).admin.username
      const admin: any = await AdminModel.findOne({ where: { username } })
      if (admin !== null) {
        isAdminExists = { status: 200, message: 'Ok', body: true }
      }
    }
    catch (e) {
      isAdminExists = { status: 500, message: 'Internal Server Error', body: false }
    }
    return isAdminExists
  }

}

export { AuthenticateAdminService }
