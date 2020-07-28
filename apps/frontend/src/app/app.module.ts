import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { ListenerPageComponent } from './listener-page/listener-page.component';
import { StreamPageComponent } from './stream-page/stream-page.component';
import { VisualizerComponent } from './visualizer/visualizer.component';

@NgModule({
  declarations: [
    AppComponent,
    ListenerPageComponent,
    StreamPageComponent,
    VisualizerComponent,
  ],
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
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
