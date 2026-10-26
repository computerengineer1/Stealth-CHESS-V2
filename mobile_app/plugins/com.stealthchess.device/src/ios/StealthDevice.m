#import <Cordova/CDV.h>

@interface StealthDevice : CDVPlugin
@end

@implementation StealthDevice
- (void)getHwid:(CDVInvokedUrlCommand*)command {
    NSString* idfv = [[[UIDevice currentDevice] identifierForVendor] UUIDString];
    CDVPluginResult* result = [CDVPluginResult resultWithStatus:CDVCommandStatus_OK
                                messageAsString:(idfv ? idfv : @"")];
    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}
@end
