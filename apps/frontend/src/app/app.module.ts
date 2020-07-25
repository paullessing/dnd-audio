import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { SocketIoModule } from 'ngx-socket-io';
import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { ListenerPageComponent } from './listener-page/listener-page.component';
import { StreamPageComponent } from './stream-page/stream-page.component';

@NgModule({
  declarations: [AppComponent, ListenerPageComponent, StreamPageComponent],
  imports: [
    BrowserModule,
    HttpClientModule,
    RouterModule.forRoot([{
      path: 'stream',
      component: StreamPageComponent,
    }, {
      path: 'listen',
      component: ListenerPageComponent,
    }, {
      path: '**',
      redirectTo: 'listen',
    }]),
    SocketIoModule.forRoot({
      url: 'http://localhost:4200',
    }),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
